
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Check, X, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SalesRep {
  id: string;
  name: string;
  email: string;
}

interface SalespersonEditorProps {
  facilityId: string;
  currentSalespersonId?: string;
  currentSalespersonName?: string;
  onUpdate: () => void;
}

const SalespersonEditor = ({ 
  facilityId, 
  currentSalespersonId, 
  currentSalespersonName,
  onUpdate 
}: SalespersonEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState(currentSalespersonId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSalesReps(data || []);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // First, remove any existing assignment
      if (currentSalespersonId) {
        await supabase
          .from('facility_sales_assignments')
          .delete()
          .eq('facility_id', facilityId);
      }

      // Then add new assignment if a salesperson is selected
      if (selectedSalesRepId) {
        const { error } = await supabase
          .from('facility_sales_assignments')
          .insert({
            facility_id: facilityId,
            sales_rep_id: selectedSalesRepId,
            is_primary: true
          });

        if (error) throw error;
      }

      toast.success('Salesperson assignment updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating salesperson:', error);
      toast.error('Failed to update salesperson assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedSalesRepId(currentSalespersonId || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={selectedSalesRepId}
          onValueChange={setSelectedSalesRepId}
          disabled={loading}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select rep..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No assignment</SelectItem>
            {salesReps.map((rep) => (
              <SelectItem key={rep.id} value={rep.id}>
                {rep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={loading}
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm">
        <User className="w-3 h-3 text-gray-400" />
        <span>{currentSalespersonName || "Unassigned"}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
      >
        <Edit className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default SalespersonEditor;
