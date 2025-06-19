
import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

interface BodyPartsSelectorProps {
  control: Control<any>;
  name: string;
}

const BODY_PARTS = [
  { id: 'head', label: 'Head' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'face', label: 'Face' },
  { id: 'neck', label: 'Neck' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'hands', label: 'Hands' },
  { id: 'fingers', label: 'Fingers' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'hips', label: 'Hips' },
  { id: 'legs', label: 'Legs' },
  { id: 'knees', label: 'Knees' },
  { id: 'feet', label: 'Feet' },
  { id: 'toes', label: 'Toes' },
  { id: 'multiple', label: 'Multiple Body Parts' },
  { id: 'other', label: 'Other' },
];

export const BodyPartsSelector: React.FC<BodyPartsSelectorProps> = ({ control, name }) => {
  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>Body Part(s) Affected *</FormLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {BODY_PARTS.map((bodyPart) => (
              <FormField
                key={bodyPart.id}
                control={control}
                name={name}
                render={({ field }) => {
                  return (
                    <FormItem
                      key={bodyPart.id}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(bodyPart.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, bodyPart.id])
                              : field.onChange(
                                  field.value?.filter(
                                    (value: string) => value !== bodyPart.id
                                  )
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {bodyPart.label}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
