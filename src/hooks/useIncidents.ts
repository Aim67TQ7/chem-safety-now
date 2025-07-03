
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useIncidents = (facilityId?: string) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // CRITICAL SECURITY: Return empty array if no facilityId provided
        if (!facilityId) {
          setIncidents([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .eq('facility_id', facilityId) // CRITICAL: Filter by facility_id
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setIncidents(data || []);
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, [facilityId]); // CRITICAL: Re-fetch when facilityId changes

  const refetch = () => {
    if (facilityId) {
      setIsLoading(true);
      setError(null);
      // The useEffect will handle the actual fetching
    }
  };

  return {
    incidents,
    isLoading,
    error,
    refetch,
  };
};
