
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search, ExternalLink, AlertTriangle, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

const SDSSearch = ({ facilityData, currentLocation }: SDSSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  // Mock search results for demonstration
  const mockResults: SearchResult[] = [
    {
      id: "1",
      product_name: "WD-40 Multi-Use Product",
      manufacturer: "WD-40 Company",
      h_codes: [
        { code: "H222", description: "Extremely flammable aerosol" },
        { code: "H229", description: "Pressurized container" }
      ],
      pictograms: [
        { ghs_code: "GHS02", name: "Flame" },
        { ghs_code: "GHS04", name: "Gas Cylinder" }
      ],
      source_url: "https://example.com/sds/wd40.pdf",
      last_updated: "2024-01-15"
    },
    {
      id: "2", 
      product_name: "Loctite 401 Instant Adhesive",
      manufacturer: "Henkel Corporation",
      h_codes: [
        { code: "H315", description: "Causes skin irritation" },
        { code: "H319", description: "Causes serious eye irritation" },
        { code: "H335", description: "May cause respiratory irritation" }
      ],
      pictograms: [
        { ghs_code: "GHS07", name: "Exclamation Mark" }
      ],
      source_url: "https://example.com/sds/loctite401.pdf",
      last_updated: "2024-02-01"
    }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Log the search for compliance
      const searchLog = {
        query: searchQuery,
        timestamp: new Date().toISOString(),
        facility: facilityData.facilityName,
        location: currentLocation,
        user_agent: navigator.userAgent
      };
      
      // In real app, this would call the backend API
      // const response = await fetch('http://localhost:5000/api/search', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ query: searchQuery })
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter mock results based on search query
      const filtered = mockResults.filter(result => 
        result.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchResults(filtered);
      
      if (filtered.length === 0) {
        toast({
          title: "No Results Found",
          description: "Try searching with a different product name or manufacturer.",
        });
      }
      
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Please check your connection and try again.",
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
              Find chemical safety information instantly. Search by product name or manufacturer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter product name (e.g., WD-40, Loctite 401)"
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
                  Searching...
                </div>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
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
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    Updated: {new Date(result.last_updated).toLocaleDateString()}
                  </div>
                </div>

                {/* Hazard Information */}
                <div className="space-y-3">
                  {/* H-Codes */}
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Hazard Statements:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.h_codes.map((hcode, index) => (
                        <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                          {hcode.code}: {hcode.description}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* GHS Pictograms */}
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">GHS Pictograms:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.pictograms.map((pictogram, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-800 border-red-300 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {pictogram.ghs_code} - {pictogram.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    variant="default"
                    onClick={() => window.open(result.source_url, '_blank')}
                    className="flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full SDS
                  </Button>
                  
                  <Button variant="outline">
                    Generate Label
                  </Button>
                  
                  <Button variant="outline">
                    Ask AI About This Chemical
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Search Suggestions */}
      {searchResults.length === 0 && !isSearching && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Popular Searches
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['WD-40', 'Loctite 401', 'Simple Green', 'Acetone', 'Isopropyl Alcohol', 'Brake Cleaner'].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                onClick={() => {
                  setSearchQuery(suggestion);
                  handleSearch();
                }}
                className="text-left justify-start"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Search Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Search Tips
        </h4>
        
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Search by exact product name for best results (e.g., "WD-40")</li>
          <li>• Try manufacturer names if you can't find a product</li>
          <li>• Use common chemical names (e.g., "Acetone" instead of "2-Propanone")</li>
          <li>• All searches are logged automatically for OSHA compliance</li>
        </ul>
      </Card>
    </div>
  );
};

export default SDSSearch;
