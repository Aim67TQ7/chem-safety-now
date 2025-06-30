
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Check, X, User, AlertCircle } from "lucide-react";
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
  const [error, setError] = useState<string>("");

  console.log('SalespersonEditor props:', { 
    facilityId, 
    currentSalespersonId, 
    currentSalespersonName 
  });

  useEffect(() => {
    if (isEditing) {
      fetchSalesReps();
    }
  }, [isEditing]);

  const fetchSalesReps = async () => {
    try {
      setError("");
      console.log('Fetching sales reps...');
      
      const { data, error } = await supabase
        .from('sales_reps')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching sales reps:', error);
        throw error;
      }
      
      console.log('Sales reps fetched:', data);
      setSalesReps(data || []);
    } catch (error) {
      console.error('Error in fetchSalesReps:', error);
      setError('Failed to load sales representatives');
      toast.error('Failed to load sales representatives');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log('Saving assignment:', { facilityId, selectedSalesRepId, currentSalespersonId });
      
      // First, remove any existing assignment
      if (currentSalespersonId) {
        console.log('Removing existing assignment...');
        const { error: deleteError } = await supabase
          .from('facility_sales_assignments')
          .delete()
          .eq('facility_id', facilityId);

        if (deleteError) {
          console.error('Error removing existing assignment:', deleteError);
          throw deleteError;
        }
      }

      // Then add new assignment if a salesperson is selected
      if (selectedSalesRepId) {
        console.log('Adding new assignment...');
        const { error } = await supabase
          .from('facility_sales_assignments')
          .insert({
            facility_id: facilityId,
            sales_rep_id: selectedSalesRepId,
            is_primary: true
          });

        if (error) {
          console.error('Error adding assignment:', error);
          throw error;
        }
      }

      console.log('Assignment saved successfully');
      toast.success('Salesperson assignment updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating salesperson:', error);
      setError('Failed to update assignment');
      toast.error('Failed to update salesperson assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedSalesRepId(currentSalespersonId || "");
    setIsEditing(false);
    setError("");
  };

  const handleEditClick = () => {
    console.log('Edit button clicked');
    setIsEditing(true);
  };

  if (error && !isEditing) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Error loading editor</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <div className="text-red-600 text-xs mr-2">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            {error}
          </div>
        )}
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
        onClick={handleEditClick}
      >
        <Edit className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default SalespersonEditor;
