
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature found");

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret || "");
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription event", { 
          subscriptionId: subscription.id,
          customerId,
          status: subscription.status 
        });

        // Get customer details to find email
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer || customer.deleted || !customer.email) {
          logStep("Customer not found or no email", { customerId });
          break;
        }

        // Find facility by email
        const { data: facility, error: facilityError } = await supabaseClient
          .from('facilities')
          .select('id, facility_name')
          .eq('email', customer.email)
          .single();

        if (facilityError || !facility) {
          logStep("Facility not found for email", { email: customer.email });
          break;
        }

        // Determine plan type from subscription
        let planType = 'basic';
        let accessLevel = 'basic';
        if (subscription.items.data.length > 0) {
          const price = subscription.items.data[0].price;
          const amount = price.unit_amount || 0;
          // Updated pricing tiers
          if (amount >= 3900) { // $39+ = premium
            planType = 'premium';
            accessLevel = 'premium';
          } else if (amount >= 1900) { // $19+ = pro
            planType = 'pro';
            accessLevel = 'pro';
          } else if (amount >= 500) { // $5+ = basic
            planType = 'basic';
            accessLevel = 'basic';
          }
        }

        // Determine status
        let facilityStatus = 'trial';
        if (subscription.status === 'active') {
          facilityStatus = planType;
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          facilityStatus = 'trial';
          accessLevel = 'trial';
        }

        // Update facility with Stripe data
        const { error: updateError } = await supabaseClient
          .from('facilities')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscription_status: facilityStatus,
            feature_access_level: accessLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', facility.id);

        if (updateError) {
          logStep("Failed to update facility", { error: updateError });
        } else {
          logStep("Facility updated successfully", { 
            facilityId: facility.id,
            status: facilityStatus,
            accessLevel 
          });
        }

        // Record payment if subscription is active
        if (subscription.status === 'active' && event.type !== 'customer.subscription.deleted') {
          const { error: paymentError } = await supabaseClient
            .from('subscription_payments')
            .upsert({
              facility_id: facility.id,
              stripe_subscription_id: subscription.id,
              amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
              currency: subscription.items.data[0]?.price.currency || 'usd',
              payment_status: 'paid',
              billing_period: subscription.items.data[0]?.price.recurring?.interval || 'month',
              billing_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              billing_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            });

          if (paymentError) {
            logStep("Failed to record payment", { error: paymentError });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        
        logStep("Payment succeeded", { invoiceId: invoice.id });
        
        // Update payment record
        const { error } = await supabaseClient
          .from('subscription_payments')
          .update({ payment_status: 'paid' })
          .eq('stripe_subscription_id', invoice.subscription);
          
        if (error) {
          logStep("Failed to update payment status", { error });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        
        logStep("Payment failed", { invoiceId: invoice.id });
        
        // Update payment record
        const { error } = await supabaseClient
          .from('subscription_payments')
          .update({ payment_status: 'failed' })
          .eq('stripe_subscription_id', invoice.subscription);
          
        if (error) {
          logStep("Failed to update payment status", { error });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
