import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Loader2, Lightbulb, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchSuggestion {
  corrected_query?: string;
  spelling_corrections?: string[];
  suggested_manufacturers?: string[];
  alternative_terms?: string[];
  search_tips?: string[];
  confidence: number;
}

interface SDSSearchInputProps {
  facilityId: string;
  onSearchResults: (results: any[]) => void;
  onSearchStart: () => void;
}

const SDSSearchInput = ({ facilityId, onSearchResults, onSearchStart }: SDSSearchInputProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getSearchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    setIsGettingSuggestions(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-search-assist', {
        body: { query: query.trim() }
      });

      if (error) {
        console.error('❌ AI search assist error:', error);
        return;
      }

      console.log('🤖 Search suggestions:', data.suggestions);
      setSuggestions(data.suggestions);
      setShowSuggestions(true);
      
    } catch (error) {
      console.error('❌ Failed to get search suggestions:', error);
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce the AI suggestions
    const timeoutId = setTimeout(() => {
      getSearchSuggestions(value);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handleSearch = async (queryOverride?: string) => {
    const finalQuery = queryOverride || searchQuery;
    
    if (!finalQuery.trim()) {
      toast.error('Please enter a product name, material, or manufacturer to search');
      return;
    }

    console.log('🔍 Starting SDS search for:', finalQuery);
    setIsSearching(true);
    onSearchStart();
    setShowSuggestions(false);

    // Create a timeout promise that rejects after 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Search timed out after 15 seconds'));
      }, 15000);
    });

    // Create the search promise
    const searchPromise = supabase.functions.invoke('sds-search', {
      body: {
        product_name: finalQuery.trim(),
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
        toast.success(`Found ${data.results.length} SDS document${data.results.length > 1 ? 's' : ''} for "${finalQuery}"`);
      } else {
        onSearchResults([]);
        toast.error(`No SDS documents found for "${finalQuery}". Try a different product name or manufacturer.`);
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

  const applySuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSuggestions(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        {/* Glowing background for the search area */}
        <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl blur opacity-30 animate-pulse"></div>
        
        <div className="relative flex gap-4 p-2 bg-white rounded-2xl border-4 border-orange-400 shadow-2xl">
          <Input
            type="text"
            placeholder="Enter chemical name, product, or manufacturer (e.g., Acetone, 3M Scotch-Weld, Loctite 242...)"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isSearching}
            className="flex-1 text-xl md:text-2xl py-8 px-6 border-3 border-orange-300 focus:border-red-500 focus:ring-4 focus:ring-orange-200 bg-white shadow-lg font-semibold placeholder:text-gray-600 placeholder:font-bold"
          />
          <Button 
            onClick={() => handleSearch()}
            disabled={isSearching || !searchQuery.trim()}
            size="lg"
            className="px-8 md:px-12 py-8 text-xl md:text-2xl bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 hover:from-orange-700 hover:to-red-700 text-white font-black shadow-2xl transform transition-all hover:scale-110 border-2 border-white"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                SEARCHING...
              </>
            ) : (
              <>
                <Search className="w-6 h-6 mr-3" />
                SEARCH SDS NOW
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Search Suggestions */}
      {showSuggestions && suggestions && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI Search Assistant</span>
              {isGettingSuggestions && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
            </div>
            
            <div className="space-y-3 text-sm">
              {/* Spelling Corrections */}
              {suggestions.corrected_query && (
                <div>
                  <div className="font-medium text-blue-800 mb-1">Did you mean:</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applySuggestion(suggestions.corrected_query!)}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {suggestions.corrected_query}
                  </Button>
                </div>
              )}

              {/* Manufacturer Suggestions */}
              {suggestions.suggested_manufacturers && suggestions.suggested_manufacturers.length > 0 && (
                <div>
                  <div className="font-medium text-blue-800 mb-1">Try with manufacturer:</div>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.suggested_manufacturers.slice(0, 3).map((manufacturer, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => applySuggestion(`${manufacturer} ${searchQuery}`)}
                        className="text-xs text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        {manufacturer}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Terms */}
              {suggestions.alternative_terms && suggestions.alternative_terms.length > 0 && (
                <div>
                  <div className="font-medium text-blue-800 mb-1">Alternative names:</div>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.alternative_terms.slice(0, 3).map((term, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => applySuggestion(term)}
                        className="text-xs text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Tips */}
              {suggestions.search_tips && suggestions.search_tips.length > 0 && (
                <div>
                  <div className="font-medium text-blue-800 mb-1">SDS Search tips:</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {suggestions.search_tips.slice(0, 4).map((tip, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-400 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(false)}
              className="mt-2 text-xs text-blue-600 hover:bg-blue-100"
            >
              Hide suggestions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SDSSearchInput;
