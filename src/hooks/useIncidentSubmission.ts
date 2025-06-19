
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useIncidentSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitIncident = async (incidentData: any) => {
    setIsSubmitting(true);
    try {
      // Get current facility ID (this would come from your app's context/state)
      // For now, we'll use a placeholder - in real app, get from user session
      const facilityId = 'placeholder-facility-id';

      // Extract images from the data
      const { images, ...restData } = incidentData;

      // Prepare the data for submission
      const submissionData = {
        ...restData,
        facility_id: facilityId,
        // Convert dates to ISO strings
        incident_date: incidentData.incident_date?.toISOString(),
        person_involved_dob: incidentData.person_involved_dob?.toISOString(),
        person_involved_date_hired: incidentData.person_involved_date_hired?.toISOString(),
      };

      console.log('Submitting incident data:', submissionData);

      const { data, error } = await supabase
        .from('incidents')
        .insert(submissionData)
        .select()
        .single();

      if (error) {
        console.error('Error submitting incident:', error);
        toast({
          title: 'Error',
          description: 'Failed to submit incident report. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      // If there are images, save them to the incident_images table
      if (images && images.length > 0 && data) {
        const imageRecords = images.map((imageUrl: string, index: number) => ({
          incident_id: data.id,
          image_url: imageUrl,
          file_name: `incident_image_${index + 1}`,
          description: `Incident photo ${index + 1}`,
        }));

        const { error: imageError } = await supabase
          .from('incident_images')
          .insert(imageRecords);

        if (imageError) {
          console.error('Error saving incident images:', imageError);
          // Don't fail the whole submission if images fail to save
          toast({
            title: 'Warning',
            description: 'Incident saved but some images failed to upload.',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Incident report submitted successfully.',
      });

      return true;
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitIncident,
    isSubmitting,
  };
};
