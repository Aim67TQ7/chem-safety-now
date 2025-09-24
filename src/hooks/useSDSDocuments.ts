import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

interface SDSDocument {
  id: string;
  product_name: string;
  manufacturer?: string | null;
  cas_number?: string | null;
  source_url: string;
  bucket_url?: string | null;
  file_name: string;
  extraction_quality_score?: number | null;
  is_readable?: boolean | null;
  created_at: string;
  h_codes?: any; // JSON field from Supabase
  signal_word?: string | null;
  pictograms?: any; // JSON field from Supabase
  ai_extraction_confidence?: number | null;
  extraction_status?: string | null;
  ai_extracted_data?: any;
}

interface UseSDSDocumentsOptions {
  searchTerm: string;
  filterType: string;
  filterStatus: string;
  pageSize?: number;
  facilityId?: string;
}

export const useSDSDocuments = ({
  searchTerm,
  filterType,
  filterStatus,
  pageSize = 20,
  facilityId
}: UseSDSDocumentsOptions) => {
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 1200);

  // Reset page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterType, filterStatus, facilityId]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sds-documents', currentPage, debouncedSearchTerm, filterType, filterStatus, facilityId],
    queryFn: async () => {
      console.log('🔍 Fetching SDS documents directly from Supabase...', { facilityId });
      
      let query;
      
      if (facilityId) {
        // For facility context: only show documents the facility has interacted with
        console.log('📋 Fetching facility-specific documents for:', facilityId);
        query = supabase
          .from('sds_documents')
          .select(`
            *,
            sds_interactions!inner(facility_id, created_at)
          `, { count: 'exact' })
          .eq('sds_interactions.facility_id', facilityId)
          .order('created_at', { ascending: false });
      } else {
        // Show all documents for everyone
        console.log('📋 Fetching all documents');
        query = supabase
          .from('sds_documents')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });
      }

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`product_name.ilike.%${debouncedSearchTerm}%,manufacturer.ilike.%${debouncedSearchTerm}%,cas_number.ilike.%${debouncedSearchTerm}%`);
      }

      // Apply type filter
      if (filterType !== 'all') {
        query = query.eq('document_type', filterType);
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('extraction_status', filterStatus);
      }

      // Apply pagination
      const offset = (currentPage - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data: documents, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching documents:', error);
        throw new Error(error.message);
      }

      console.log('✅ Fetched documents:', documents?.length || 0, 'of', count || 0, 'total');

      return {
        documents: documents || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasMore: count ? (offset + pageSize) < count : false
      };
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Quick filter counts
  const filterCounts = useMemo(() => {
    if (!data?.documents) return null;
    
    const docs = data.documents;
    return {
      manualReview: docs.filter(doc => doc.extraction_status === 'manual_review_required').length,
      highQuality: docs.filter(doc => (doc.ai_extraction_confidence || 0) >= 80).length,
      readable: docs.filter(doc => doc.is_readable).length
    };
  }, [data?.documents]);

  return {
    documents: data?.documents || [],
    totalCount: data?.count || 0,
    totalPages: data?.totalPages || 1,
    hasMore: data?.hasMore || false,
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    refetch,
    filterCounts,
    isSearching: debouncedSearchTerm !== searchTerm // Show loading when debouncing
  };
};