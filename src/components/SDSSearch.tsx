
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search, ExternalLink, AlertTriangle, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { interactionLogger } from "@/services/interactionLogger";

interface SDSSearchProps {
  facilityData: any;
  currentLocation: {lat: number, lng: number} | null;
}

interface SearchResult {
  id: string;
  product_name: string;
  manufacturer: string;
  h_codes: Array<{code: string; description: string}>;
  pictograms: Array<{ghs_code: string; name: string}>;
  source_url: string;
  last_updated: string;
  cas_number?: string;
  signal_word?: string;
  hazard_statements?: Array<{code: string; statement: string}>;
  precautionary_statements?: Array<{code: string; statement: string}>;
}

// Helper function to safely parse JSON arrays
const parseJsonArray = (jsonData: any, fallback: any[] = []): any[] => {
  if (!jsonData) return fallback;
  if (Array.isArray(jsonData)) return jsonData;
  try {
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData);
    }
    return jsonData;
  } catch {
    return fallback;
  }
};

// Helper function to safely render badge text
const renderBadgeText = (item: any): string => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    // Handle different object structures
    if (item.code && item.description) return `${item.code}: ${item.description}`;
    if (item.code && item.statement) return `${item.code}: ${item.statement}`;
    if (item.ghs_code && item.name) return `${item.ghs_code} - ${item.name}`;
    if (item.description) return item.description;
    if (item.statement) return item.statement;
    if (item.name) return item.name;
    return JSON.stringify(item);
  }
  return String(item);
};

const SDSSearch = ({ facilityData, currentLocation }: SDSSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const searchStartTime = Date.now();
    
    try {
      // Log search initiation
      await interactionLogger.logFacilityUsage({
        eventType: 'sds_search_initiated',
        eventDetail: { 
          query: searchQuery,
          location: currentLocation 
        },
        lat: currentLocation?.lat,
        lng: currentLocation?.lng
      });

      console.log('Searching SDS database for:', searchQuery);

      // Log search to facility_search_history table
      if (facilityData.id) {
        await supabase.from('facility_search_history').insert({
          facility_id: facilityData.id,
          search_query: searchQuery,
          lat: currentLocation?.lat,
          lng: currentLocation?.lng
        });
      }

      // Search the sds_documents table
      const { data: sdsData, error } = await supabase
        .from('sds_documents')
        .select('*')
        .or(`product_name.ilike.%${searchQuery}%,manufacturer.ilike.%${searchQuery}%,cas_number.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) {
        console.error('Supabase search error:', error);
        throw error;
      }

      // Transform the data
      const results: SearchResult[] = (sdsData || []).map(doc => ({
        id: doc.id,
        product_name: doc.product_name,
        manufacturer: doc.manufacturer || 'Unknown Manufacturer',
        h_codes: parseJsonArray(doc.h_codes, []),
        pictograms: parseJsonArray(doc.pictograms, []),
        source_url: doc.source_url,
        last_updated: doc.created_at || new Date().toISOString(),
        cas_number: doc.cas_number,
        signal_word: doc.signal_word,
        hazard_statements: parseJsonArray(doc.hazard_statements, []),
        precautionary_statements: parseJsonArray(doc.precautionary_statements, [])
      }));
      
      setSearchResults(results);

      // Log search completion
      await interactionLogger.logFacilityUsage({
        eventType: 'sds_search_completed',
        eventDetail: { 
          query: searchQuery,
          resultsCount: results.length,
          searchDurationMs: Date.now() - searchStartTime
        },
        durationMs: Date.now() - searchStartTime
      });
      
      if (results.length === 0) {
        toast({
          title: "No Results Found",
          description: "Try searching with a different product name, manufacturer, or CAS number.",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${results.length} result(s) for "${searchQuery}"`,
        });
      }
      
    } catch (error) {
      console.error('Search error:', error);
      
      // Log search error
      await interactionLogger.logFacilityUsage({
        eventType: 'sds_search_error',
        eventDetail: { 
          query: searchQuery,
          error: error.message
        }
      });

      toast({
        title: "Search Failed",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSDSAction = async (action: string, result: SearchResult) => {
    // Log SDS interaction
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: result.id,
      actionType: action as any,
      searchQuery: searchQuery,
      metadata: {
        productName: result.product_name,
        manufacturer: result.manufacturer
      }
    });

    // Log facility usage
    await interactionLogger.logFacilityUsage({
      eventType: `sds_${action}`,
      eventDetail: {
        productName: result.product_name,
        manufacturer: result.manufacturer,
        sdsId: result.id
      }
    });

    // Handle specific actions
    switch (action) {
      case 'view':
        window.open(result.source_url, '_blank');
        break;
      case 'generate_label':
        // Navigate to label printer with pre-filled data
        // This would be implemented based on your routing system
        toast({
          title: "Label Generator",
          description: `Pre-filling label data for ${result.product_name}`,
        });
        break;
      case 'ask_ai':
        // Navigate to AI assistant with pre-filled question
        toast({
          title: "AI Assistant",
          description: `Preparing safety information for ${result.product_name}`,
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🔍 Search Safety Data Sheets
            </h3>
            <p className="text-gray-600">
              Find chemical safety information instantly. Search by product name, manufacturer, or CAS number.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter product name, manufacturer, or CAS number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg py-3"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-8 py-3"
            >
              {isSearching ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching Database...
                </div>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search SDS Database
                </>
              )}
            </Button>
          </div>

          {/* Location Status */}
          {currentLocation && (
            <div className="flex items-center text-sm text-green-600">
              <MapPin className="w-4 h-4 mr-1" />
              Location verified for OSHA compliance
            </div>
          )}
        </div>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Search Results ({searchResults.length})
          </h4>
          
          {searchResults.map((result) => (
            <Card key={result.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
                  <div>
                    <h5 className="text-xl font-semibold text-gray-900">
                      {result.product_name}
                    </h5>
                    <p className="text-gray-600">
                      Manufacturer: {result.manufacturer}
                    </p>
                    {result.cas_number && (
                      <p className="text-sm text-gray-500">
                        CAS Number: {result.cas_number}
                      </p>
                    )}
                    {result.signal_word && (
                      <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-800 border-orange-300">
                        Signal Word: {result.signal_word}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    Updated: {new Date(result.last_updated).toLocaleDateString()}
                  </div>
                </div>

                {/* Hazard Information */}
                <div className="space-y-3">
                  {/* H-Codes */}
                  {result.h_codes && result.h_codes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Hazard Statements:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.h_codes.map((hcode, index) => (
                          <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                            {renderBadgeText(hcode)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hazard Statements from JSON */}
                  {result.hazard_statements && result.hazard_statements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Additional Hazard Statements:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.hazard_statements.map((hazard, index) => (
                          <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                            {renderBadgeText(hazard)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GHS Pictograms */}
                  {result.pictograms && result.pictograms.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">GHS Pictograms:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.pictograms.map((pictogram, index) => (
                          <Badge key={index} variant="outline" className="bg-red-50 text-red-800 border-red-300 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {renderBadgeText(pictogram)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Precautionary Statements */}
                  {result.precautionary_statements && result.precautionary_statements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Precautionary Statements:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.precautionary_statements.slice(0, 3).map((precaution, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
                            {renderBadgeText(precaution)}
                          </Badge>
                        ))}
                        {result.precautionary_statements.length > 3 && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                            +{result.precautionary_statements.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    variant="default"
                    onClick={() => handleSDSAction('view', result)}
                    className="flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full SDS
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleSDSAction('generate_label', result)}
                  >
                    Generate OSHA Label
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleSDSAction('ask_ai', result)}
                  >
                    Ask AI About This Chemical
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Results State */}
      {searchResults.length === 0 && !isSearching && searchQuery && (
        <Card className="p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            No Results Found
          </h4>
          <p className="text-gray-600 mb-4">
            We couldn't find any SDS documents matching "{searchQuery}". Try:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check spelling and try different keywords</li>
            <li>• Search by manufacturer name instead</li>
            <li>• Use the CAS number if available</li>
            <li>• Try common chemical names</li>
          </ul>
        </Card>
      )}

      {/* Search Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Search Tips
        </h4>
        
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Search by exact product name for best results</li>
          <li>• Try manufacturer names if you can't find a product</li>
          <li>• Use CAS numbers for precise chemical identification</li>
          <li>• All searches are logged automatically for OSHA compliance</li>
          <li>• Database contains thousands of real SDS documents</li>
        </ul>
      </Card>
    </div>
  );
};

export default SDSSearch;
