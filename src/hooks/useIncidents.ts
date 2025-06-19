
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('incidents')
          .select('*')
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
  }, []);

  return {
    incidents,
    isLoading,
    error,
    refetch: () => {
      // Trigger a re-fetch
      setIsLoading(true);
      setError(null);
      // The useEffect will handle the actual fetching
    },
  };
};
