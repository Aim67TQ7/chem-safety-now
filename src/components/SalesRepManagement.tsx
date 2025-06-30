
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone?: string;
  territory?: string;
  hire_date: string;
  is_active: boolean;
  commission_rate: number;
  created_at: string;
}

interface SalesRepFormData {
  name: string;
  email: string;
  phone: string;
  territory: string;
  commission_rate: number;
}

const SalesRepManagement = () => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<SalesRep | null>(null);
  const navigate = useNavigate();

  const form = useForm<SalesRepFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      territory: '',
      commission_rate: 10
    }
  });

  const fetchSalesReps = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalesReps(data || []);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      toast.error('Failed to load sales representatives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const onSubmit = async (data: SalesRepFormData) => {
    try {
      if (editingRep) {
        // Update existing rep
        const { error } = await supabase
          .from('sales_reps')
          .update({
            name: data.name,
            email: data.email,
            phone: data.phone,
            territory: data.territory,
            commission_rate: data.commission_rate / 100, // Convert percentage to decimal
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRep.id);

        if (error) throw error;
        toast.success('Sales representative updated successfully');
      } else {
        // Create new rep
        const { error } = await supabase
          .from('sales_reps')
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            territory: data.territory,
            commission_rate: data.commission_rate / 100 // Convert percentage to decimal
          });

        if (error) throw error;
        toast.success('Sales representative added successfully');
      }

      setDialogOpen(false);
      setEditingRep(null);
      form.reset();
      fetchSalesReps();
    } catch (error) {
      console.error('Error saving sales rep:', error);
      toast.error('Failed to save sales representative');
    }
  };

  const toggleActive = async (rep: SalesRep) => {
    try {
      const { error } = await supabase
        .from('sales_reps')
        .update({
          is_active: !rep.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', rep.id);

      if (error) throw error;
      
      toast.success(`Sales rep ${!rep.is_active ? 'activated' : 'deactivated'}`);
      fetchSalesReps();
    } catch (error) {
      console.error('Error toggling sales rep status:', error);
      toast.error('Failed to update sales rep status');
    }
  };

  const handleEdit = (rep: SalesRep) => {
    setEditingRep(rep);
    form.reset({
      name: rep.name,
      email: rep.email,
      phone: rep.phone || '',
      territory: rep.territory || '',
      commission_rate: (rep.commission_rate * 100) // Convert decimal to percentage
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRep(null);
    form.reset();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sales Representatives Management</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Sales Rep
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRep ? 'Edit Sales Representative' : 'Add New Sales Representative'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@chemlabel-gpt.com" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="territory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Territory</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select territory" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="West Coast">West Coast</SelectItem>
                            <SelectItem value="East Coast">East Coast</SelectItem>
                            <SelectItem value="Midwest">Midwest</SelectItem>
                            <SelectItem value="South">South</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                            <SelectItem value="International">International</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.1"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingRep ? 'Update' : 'Create'} Sales Rep
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {salesReps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No sales representatives found</p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Sales Rep
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesReps.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rep.name}</div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(rep.hire_date).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{rep.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rep.territory || 'Unassigned'}</Badge>
                    </TableCell>
                    <TableCell>{(rep.commission_rate * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={rep.is_active ? "default" : "secondary"}>
                          {rep.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(rep)}
                        >
                          {rep.is_active ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/sales-rep/${rep.id}`)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rep)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesRepManagement;
