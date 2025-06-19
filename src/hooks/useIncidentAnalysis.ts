
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useIncidentAnalysis = (incidentId: string) => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!incidentId) return;

    const fetchAnalyses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('incident_ai_analysis')
          .select('*')
          .eq('incident_id', incidentId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setAnalyses(data || []);
      } catch (err) {
        console.error('Error fetching incident analyses:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyses();
  }, [incidentId]);

  const addAnalysis = (newAnalysis: any) => {
    setAnalyses(prev => [newAnalysis, ...prev]);
  };

  return {
    analyses,
    isLoading,
    error,
    addAnalysis,
    refetch: () => {
      if (incidentId) {
        setIsLoading(true);
        setError(null);
      }
    },
  };
};
