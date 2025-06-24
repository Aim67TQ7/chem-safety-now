
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

    // Create a timeout promise that rejects after 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Search timed out after 15 seconds'));
      }, 15000);
    });

    // Create the search promise
    const searchPromise = supabase.functions.invoke('sds-search', {
      body: {
        product_name: searchQuery.trim(),
        max_results: 3
      }
    });

    try {
      // Race the search against the timeout
      const { data, error } = await Promise.race([searchPromise, timeoutPromise]) as any;

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
      
      if (error.message === 'Search timed out after 15 seconds') {
        toast.error('Search timed out after 15 seconds. Please try a more specific search term.');
      } else {
        toast.error(`Search failed: ${error.message || 'Unknown error occurred'}`);
      }
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5" />
          Search Safety Data Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600">
          Enter a product name, material name, or manufacturer to search for Safety Data Sheets:
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
          <strong>Tips:</strong> Use specific product names, include manufacturer if known, or try chemical names/CAS numbers. Search times out after 15 seconds.
        </div>
      </CardContent>
    </Card>
  );
};

export default SDSSearchInput;
