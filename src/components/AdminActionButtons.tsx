
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Clock, RotateCcw, Gift } from "lucide-react";
import { toast } from "sonner";
import { AdminSubscriptionService } from "@/services/adminSubscriptionService";

interface AdminActionButtonsProps {
  facilityId: string;
  facilityName: string;
  currentStatus: string;
  onStatusUpdate: () => void;
}

const AdminActionButtons = ({ 
  facilityId, 
  facilityName, 
  currentStatus, 
  onStatusUpdate 
}: AdminActionButtonsProps) => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [planType, setPlanType] = useState<'basic' | 'premium'>('basic');
  const [duration, setDuration] = useState<number>(1);
  const [trialDays, setTrialDays] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');

  const adminEmail = sessionStorage.getItem("adminEmail") || "admin@chemlabel-gpt.com";

  const handleAction = async () => {
    setLoading(true);
    let success = false;

    try {
      switch (actionType) {
        case 'grant_free':
          success = await AdminSubscriptionService.grantFreeAccess(
            facilityId,
            planType,
            duration,
            adminEmail,
            notes
          );
          break;
        case 'extend_trial':
          success = await AdminSubscriptionService.extendTrial(
            facilityId,
            trialDays,
            adminEmail,
            notes
          );
          break;
        case 'reset_subscription':
          success = await AdminSubscriptionService.resetSubscription(
            facilityId,
            adminEmail,
            notes
          );
          break;
      }

      if (success) {
        toast.success(`Action completed successfully for ${facilityName}`);
        setDialogOpen(false);
        setNotes('');
        onStatusUpdate();
      } else {
        toast.error("Failed to complete action");
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-1">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setActionType('grant_free');
              setDialogOpen(true);
            }}
          >
            <Gift className="w-3 h-3 mr-1" />
            Grant Free
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Action: {facilityName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Action Type</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant_free">Grant Free Access</SelectItem>
                  <SelectItem value="extend_trial">Extend Trial</SelectItem>
                  <SelectItem value="reset_subscription">Reset to Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionType === 'grant_free' && (
              <>
                <div>
                  <Label>Plan Type</Label>
                  <Select value={planType} onValueChange={(value: 'basic' | 'premium') => setPlanType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic Plan</SelectItem>
                      <SelectItem value="premium">Premium Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (Months)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  />
                </div>
              </>
            )}

            {actionType === 'extend_trial' && (
              <div>
                <Label>Additional Days</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value) || 7)}
                />
              </div>
            )}

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Reason for this action..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAction}
                disabled={loading || !actionType}
                className="flex-1"
              >
                {loading ? "Processing..." : "Execute Action"}
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

      <Button 
        size="sm" 
        variant="outline"
        onClick={() => {
          setActionType('extend_trial');
          setDialogOpen(true);
        }}
      >
        <Clock className="w-3 h-3 mr-1" />
        Extend
      </Button>

      <Button 
        size="sm" 
        variant="outline"
        onClick={() => {
          setActionType('reset_subscription');
          setDialogOpen(true);
        }}
      >
        <RotateCcw className="w-3 h-3 mr-1" />
        Reset
      </Button>
    </div>
  );
};

export default AdminActionButtons;
