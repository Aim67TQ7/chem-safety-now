import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Crown, ExternalLink, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SimplifiedSDSSearchProps {
  facilityId: string;
}

interface RecentSDS {
  id: string;
  product_name: string;
  manufacturer?: string;
  created_at: string;
  bucket_url?: string;
  source_url: string;
}

const SimplifiedSDSSearch: React.FC<SimplifiedSDSSearchProps> = ({ facilityId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSDS, setRecentSDS] = useState<RecentSDS[]>([]);
  const navigate = useNavigate();

  // Load recent SDS documents
  useEffect(() => {
    const loadRecentSDS = async () => {
      try {
        // Get recent SDS interactions with document details
        const { data, error } = await supabase
          .from('sds_interactions')
          .select(`
            sds_document_id,
            created_at,
            sds_documents (
              id,
              product_name,
              manufacturer,
              bucket_url,
              source_url
            )
          `)
          .eq('facility_id', facilityId)
          .not('sds_document_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          console.error('Error loading recent SDS:', error);
          return;
        }

        // Transform the data to include document details
        const recentDocs = data
          ?.filter(item => item.sds_documents)
          .map(item => ({
            id: item.sds_documents.id,
            product_name: item.sds_documents.product_name,
            manufacturer: item.sds_documents.manufacturer,
            created_at: item.created_at,
            bucket_url: item.sds_documents.bucket_url,
            source_url: item.sds_documents.source_url
          })) || [];

        setRecentSDS(recentDocs);
      } catch (error) {
        console.error('Failed to load recent SDS:', error);
      }
    };

    loadRecentSDS();
  }, [facilityId]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a product name to search');
      return;
    }

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sds-search', {
        body: { 
          product_name: searchTerm.trim(),
          max_results: 5
        }
      });

      if (error) throw error;

      if (data.results && data.results.length > 0) {
        // Navigate to SDS documents page with search results
        navigate(`/facility/${facilityId.split('/').pop()}/sds-documents?search=${encodeURIComponent(searchTerm)}`);
      } else {
        toast.info('No SDS documents found for this product');
      }

    } catch (error: any) {
      toast.error(`Search failed: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRecentClick = (doc: RecentSDS) => {
    const url = doc.bucket_url || doc.source_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search SDS Documents
            </div>
            <Button 
              onClick={() => navigate('/subscription-plans')}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Crown className="w-4 h-4" />
              Upgrade
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter product name or chemical (e.g., Acetone, Loctite 242...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="px-6"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent SDS */}
      {recentSDS.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent SDS Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSDS.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRecentClick(doc)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{doc.product_name}</div>
                      {doc.manufacturer && (
                        <div className="text-sm text-gray-600">{doc.manufacturer}</div>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimplifiedSDSSearch;