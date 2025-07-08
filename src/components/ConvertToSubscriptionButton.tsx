
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConvertToSubscriptionButtonProps {
  facilityId: string;
  facilityName: string;
  salesRepId?: string;
  onConversionComplete?: () => void;
}

const ConvertToSubscriptionButton = ({ 
  facilityId, 
  facilityName, 
  salesRepId,
  onConversionComplete 
}: ConvertToSubscriptionButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const handleConvert = async () => {
    if (!salesRepId) {
      toast.error("No sales rep assigned to this facility");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('convert_trial_to_paid', {
        p_facility_id: facilityId,
        p_sales_rep_id: salesRepId,
        p_plan_type: 'basic',
        p_billing_period: billingPeriod
      });

      if (error) throw error;

      if (data) {
        toast.success(`Successfully converted ${facilityName} to paid subscription!`);
        setDialogOpen(false);
        onConversionComplete?.();
      } else {
        toast.error("Failed to convert facility - may not be in trial status");
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error("Failed to convert subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <Crown className="w-3 h-3 mr-1" />
          Convert to Paid
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert {facilityName} to Paid Subscription</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Billing Period</label>
            <Select value={billingPeriod} onValueChange={(value: 'monthly' | 'annual') => setBillingPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Monthly - $156/month
                  </div>
                </SelectItem>
                <SelectItem value="annual">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Annual - $1,596/year (Save $276!)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              This will convert the facility from trial to a paid basic subscription.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleConvert}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? "Converting..." : "Convert to Paid"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToSubscriptionButton;
