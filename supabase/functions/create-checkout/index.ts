
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // For facility-based subscriptions, we don't require user authentication
    // Instead, we'll use the facility's email from the facilitySlug
    logStep("Processing facility-based checkout");

    const { planId, billingCycle, facilitySlug } = await req.json();
    logStep("Request data", { planId, billingCycle, facilitySlug });

    // Get facility data - required for facility-based subscriptions
    if (!facilitySlug) {
      throw new Error("Facility slug is required for facility subscriptions");
    }

    const { data: facilityData, error: facilityError } = await supabaseClient
      .from('facilities')
      .select('id, facility_name, email')
      .eq('slug', facilitySlug)
      .single();
    
    if (facilityError || !facilityData) {
      throw new Error("Facility not found");
    }
    
    logStep("Facility found", { facilityId: facilityData.id, facilityName: facilityData.facility_name, email: facilityData.email });

    // Get plan details from database
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found");
    }
    logStep("Plan found", { planName: plan.name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists using facility email
    const customers = await stripe.customers.list({ email: facilityData.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("Creating new customer for facility");
    }

    // Determine price based on billing cycle
    const priceId = billingCycle === 'annual' 
      ? plan.stripe_annual_price_id 
      : plan.stripe_monthly_price_id;

    if (!priceId) {
      throw new Error(`Price ID not found for ${billingCycle} billing`);
    }
    logStep("Using price ID", { priceId, billingCycle });

    const origin = req.headers.get("origin") || "https://qrsafetyapp.com";
    const facilityParam = facilitySlug ? `?facility=${facilitySlug}` : '';
    const successUrl = `${origin}/subscription/success${facilityParam}`;
    const cancelUrl = `${origin}/subscription/cancel${facilityParam}`;

    // Create checkout session with metadata to link facility
    const metadata: any = {
      facility_id: facilityData.id,
      facility_slug: facilitySlug,
      facility_name: facilityData.facility_name,
      plan_name: plan.name,
      billing_cycle: billingCycle
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : facilityData.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
