
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SDSSearchInputProps {
  facilityId: string;
  onSearchResults: (results: any[]) => void;
  onSearchStart: () => void;
}

const SDSSearchInput = ({ facilityId, onSearchResults, onSearchStart }: SDSSearchInputProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a product name, material, or manufacturer to search');
      return;
    }

    console.log('🔍 Starting SDS search for:', searchQuery);
    setIsSearching(true);
    onSearchStart();

    try {
      // Call the enhanced SDS search function directly - limit to 3 results for user selection
      const { data, error } = await supabase.functions.invoke('sds-search', {
        body: {
          product_name: searchQuery.trim(),
          max_results: 3
        }
      });

      if (error) {
        console.error('❌ SDS search error:', error);
        throw error;
      }

      console.log('✅ SDS search response:', data);

      if (data.results && data.results.length > 0) {
        onSearchResults(data.results);
        toast.success(`Found ${data.results.length} SDS document${data.results.length > 1 ? 's' : ''} for "${searchQuery}"`);
      } else {
        onSearchResults([]);
        toast.error(`No SDS documents found for "${searchQuery}". Try a different product name or manufacturer.`);
      }

    } catch (error: any) {
      console.error('❌ SDS search failed:', error);
      onSearchResults([]);
      toast.error(`Search failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Search Safety Data Sheets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Enter a product name, material name, or manufacturer to search for Safety Data Sheets (SDS) documents:
          </div>
          
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g., Acetone, 3M Scotch-Weld, Loctite 242..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            <strong>Search Tips:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Use specific product names for best results</li>
              <li>• Include manufacturer name if known (e.g., "3M Adhesive")</li>
              <li>• Try common chemical names (e.g., "Isopropyl Alcohol")</li>
              <li>• CAS numbers work great if available</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SDSSearchInput;
