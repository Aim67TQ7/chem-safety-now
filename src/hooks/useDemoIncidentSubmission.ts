import { useState } from 'react';
import { useDemoContext } from '@/contexts/DemoContext';
import { useIncidentSubmission } from './useIncidentSubmission';

export const useDemoIncidentSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDemo, showDemoMessage } = useDemoContext();
  const { submitIncident: actualSubmit } = useIncidentSubmission();

  const submitIncident = async (incidentData: any) => {
    if (isDemo) {
      setIsSubmitting(true);
      
      // Simulate form validation and processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitting(false);
      
      // Show demo success message
      showDemoMessage(
        'Incident Report Submitted',
        `✅ In your real site, this ${incidentData.incident_type === 'near_miss' ? 'near-miss' : 'incident'} report would be saved to your database and available for OSHA compliance reporting.`
      );
      
      return true; // Return success for demo
    }
    
    // Use actual submission for non-demo
    return actualSubmit(incidentData);
  };

  return {
    submitIncident,
    isSubmitting,
  };
};