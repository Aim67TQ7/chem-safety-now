
import React from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface WitnessFieldsProps {
  control: Control<any>;
  name: string;
}

export const WitnessFields: React.FC<WitnessFieldsProps> = ({ control, name }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Witnesses</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: '', contact_info: '' })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Witness
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-gray-500 text-sm">No witnesses added</p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-end">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <FormField
                  control={control}
                  name={`${name}.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter witness name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`${name}.${index}.contact_info`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Email or phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => remove(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
