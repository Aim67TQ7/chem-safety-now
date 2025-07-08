import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { WitnessFields } from './WitnessFields';
import { BodyPartsSelector } from './BodyPartsSelector';
import { useDemoIncidentSubmission } from '@/hooks/useDemoIncidentSubmission';
import ImageUpload, { ImageUploadRef } from './ImageUpload';

const baseIncidentSchema = z.object({
  incident_date: z.date(),
  incident_time: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  person_involved_name: z.string().min(1, 'Person name is required'),
  person_involved_job_title: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  activity_being_performed: z.string().min(1, 'Activity description is required'),
  equipment_materials_involved: z.string().optional(),
  witnesses: z.array(z.object({
    name: z.string(),
    contact_info: z.string()
  })).default([]),
  ppe_used: z.boolean().optional(),
  ppe_details: z.string().optional(),
  immediate_actions_taken: z.string().optional(),
  corrective_actions: z.string().optional(),
  additional_comments: z.string().optional(),
  form_completed_by_name: z.string().min(1, 'Form completer name is required'),
  form_completed_by_contact: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
});

const nearMissSchema = baseIncidentSchema.extend({
  incident_type: z.literal('near_miss'),
  potential_severity: z.enum(['low', 'medium', 'high', 'critical']),
  probability_recurrence: z.enum(['unlikely', 'possible', 'likely', 'certain']),
});

const reportableSchema = baseIncidentSchema.extend({
  incident_type: z.literal('reportable'),
  person_involved_dob: z.date().optional(),
  person_involved_date_hired: z.date().optional(),
  nature_of_injury_illness: z.string().min(1, 'Nature of injury/illness is required'),
  body_parts_affected: z.array(z.string()).min(1, 'At least one body part must be selected'),
  object_substance_causing_injury: z.string().optional(),
  medical_treatment_provided: z.enum(['first_aid', 'emergency_room', 'hospitalization', 'none']),
  medical_provider_name: z.string().optional(),
  medical_provider_contact: z.string().optional(),
  days_away_from_work: z.boolean().default(false),
  days_away_details: z.string().optional(),
  job_transfer_restriction: z.boolean().default(false),
  job_transfer_details: z.string().optional(),
  severity_classification: z.enum(['death', 'days_away', 'restricted_duty', 'other_recordable']).optional(),
});

type IncidentFormData = z.infer<typeof nearMissSchema> | z.infer<typeof reportableSchema>;

interface IncidentReportFormProps {
  incidentType: 'near_miss' | 'reportable';
  onSuccess: () => void;
  onCancel: () => void;
}

export const IncidentReportForm: React.FC<IncidentReportFormProps> = ({
  incidentType,
  onSuccess,
  onCancel
}) => {
  const schema = incidentType === 'near_miss' ? nearMissSchema : reportableSchema;
  const { submitIncident, isSubmitting } = useDemoIncidentSubmission();
  const imageUploadRef = useRef<ImageUploadRef>(null);

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      incident_type: incidentType,
      witnesses: [],
      body_parts_affected: [],
      days_away_from_work: false,
      job_transfer_restriction: false,
      images: [],
    },
  });

  const onSubmit = async (data: IncidentFormData) => {
    try {
      // Upload images first if any
      const imageUrls = await imageUploadRef.current?.uploadImages() || [];
      
      // Add image URLs to the form data
      const formDataWithImages = {
        ...data,
        images: imageUrls,
      };
      
      const success = await submitIncident(formDataWithImages);
      if (success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting incident with images:', error);
    }
  };

  const isReportable = incidentType === 'reportable';

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isReportable ? 'Reportable Incident Form' : 'Near-Miss Incident Form'}
        </CardTitle>
        <CardDescription>
          {isReportable 
            ? 'Complete this form for incidents involving actual injuries, illnesses, or property damage'
            : 'Document near-miss incidents to help prevent future accidents'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="incident_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Incident Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="incident_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} type="time" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location of Incident *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Specific location where incident occurred" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Person Involved Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Person Involved</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="person_involved_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="person_involved_job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isReportable && (
                  <>
                    <FormField
                      control={form.control}
                      name="person_involved_dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="person_involved_date_hired"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date Hired</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Incident Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Incident Details</h3>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isReportable ? 'Description of Incident *' : 'Description of Near-Miss Incident *'}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder={isReportable 
                          ? "Provide detailed narrative of what happened, including sequence of events"
                          : "Describe what happened and how it almost caused harm"
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activity_being_performed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Being Performed *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="What was the person doing when the incident occurred?" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipment_materials_involved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment or Materials Involved</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="List any equipment, tools, or materials involved" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reportable Incident Specific Fields */}
            {isReportable && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Injury/Illness Information</h3>
                
                <FormField
                  control={form.control}
                  name="nature_of_injury_illness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nature of Injury or Illness *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., cut, burn, strain, chemical exposure" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <BodyPartsSelector 
                  control={form.control}
                  name="body_parts_affected"
                />

                <FormField
                  control={form.control}
                  name="object_substance_causing_injury"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Object or Substance Causing Injury/Illness</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="What object or substance caused the injury?" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="medical_treatment_provided"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Treatment Provided</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select treatment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="first_aid">First Aid</SelectItem>
                            <SelectItem value="emergency_room">Emergency Room</SelectItem>
                            <SelectItem value="hospitalization">Hospitalization</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity_classification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity Classification</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="other_recordable">Other Recordable</SelectItem>
                            <SelectItem value="restricted_duty">Restricted Duty</SelectItem>
                            <SelectItem value="days_away">Days Away</SelectItem>
                            <SelectItem value="death">Death</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Near-Miss Specific Fields */}
            {!isReportable && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Risk Assessment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="potential_severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Potential Severity if Incident Had Occurred</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="probability_recurrence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probability of Recurrence</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select probability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unlikely">Unlikely</SelectItem>
                            <SelectItem value="possible">Possible</SelectItem>
                            <SelectItem value="likely">Likely</SelectItem>
                            <SelectItem value="certain">Certain</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* PPE Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Protective Equipment</h3>
              
              <FormField
                control={form.control}
                name="ppe_used"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Was Personal Protective Equipment (PPE) Used?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('ppe_used') && (
                <FormField
                  control={form.control}
                  name="ppe_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PPE Details</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} placeholder="Describe what PPE was used" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Witnesses */}
            <WitnessFields control={form.control} name="witnesses" />

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Actions</h3>
              
              <FormField
                control={form.control}
                name="immediate_actions_taken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immediate Actions Taken</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="What immediate actions were taken following the incident?" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="corrective_actions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrective Actions Planned or Implemented</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="What corrective actions are planned or have been implemented?" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <FormField
              control={form.control}
              name="additional_comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments or Information</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Any additional information that may be relevant" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload Section */}
            <div className="space-y-4">
              <ImageUpload
                ref={imageUploadRef}
                onImagesChange={(images) => {
                  // Update form with image count for validation
                  form.setValue('images', images.map(img => img.preview));
                }}
                maxImages={4}
                disabled={isSubmitting}
              />
            </div>

            {/* Form Completion */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Form Completion</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="form_completed_by_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person Completing Form *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="form_completed_by_contact"
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
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
