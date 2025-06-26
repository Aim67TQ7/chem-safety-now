
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useIncidentSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { facilitySlug } = useParams<{ facilitySlug: string }>();

  const submitIncident = async (incidentData: any) => {
    setIsSubmitting(true);
    try {
      // Get facility ID from the facility slug
      if (!facilitySlug) {
        console.error('No facility slug available');
        toast({
          title: 'Error',
          description: 'Unable to determine facility. Please navigate to a specific facility page.',
          variant: 'destructive',
        });
        return false;
      }

      console.log('Looking up facility with slug:', facilitySlug);

      // Look up the facility ID using the slug
      const { data: facility, error: facilityError } = await supabase
        .from('facilities')
        .select('id')
        .eq('slug', facilitySlug)
        .single();

      if (facilityError || !facility) {
        console.error('Error finding facility:', facilityError);
        toast({
          title: 'Error',
          description: 'Unable to find facility information.',
          variant: 'destructive',
        });
        return false;
      }

      const facilityId = facility.id;
      console.log('Found facility ID:', facilityId);

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
