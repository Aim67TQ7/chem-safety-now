
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Search, ExternalLink, UserPlus, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { useFreeSdsTrial } from '@/contexts/FreeSdsTrialContext';
import { supabase } from '@/integrations/supabase/client';

interface SDSResult {
  id?: string;
  product_name: string;
  manufacturer?: string;
  source_url: string;
  cas_number?: string;
  signal_word?: string;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SDSResult[]>([]);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const { hasUsedFreeTrial, remainingViews, useFreeTrial } = useFreeSdsTrial();

  const handleGetStarted = () => {
    navigate("/signup");
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a product name to search');
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Performing free trial SDS search for:', searchTerm);
      
      const { data, error } = await supabase.functions.invoke('sds-search', {
        body: { 
          product_name: searchTerm,
          max_results: 5 // Limit results for trial
        }
      });

      if (error) {
        console.error('❌ Search error:', error);
        toast.error('Search failed. Please try again.');
        return;
      }

      console.log('✅ Search results:', data?.results?.length || 0);
      setSearchResults(data?.results || []);
      
      if (!data?.results?.length) {
        toast.info('No results found. Try different search terms.');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewPdf = (result: SDSResult) => {
    if (hasUsedFreeTrial) {
      setShowSignupPrompt(true);
      return;
    }

    // Use the free trial
    useFreeTrial();
    window.open(result.source_url, '_blank');
    toast.success(`Opening PDF for ${result.product_name}`);
    
    // Show signup prompt after viewing
    setTimeout(() => {
      setShowSignupPrompt(true);
    }, 2000);
  };

  return (
    <section className="flex-1 flex items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
      <div className="w-full max-w-4xl">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Update your entire safety program in minutes, not months
          </h1>
          
          {/* Killer Statement */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              Find any SDS in under 10 seconds — or we'll add it for you.
            </h2>
            <p className="text-muted-foreground">
              Try our free search below. No signup required for your first PDF view.
            </p>
          </div>
          
          {/* Trial Status Badge */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Clock className="w-4 h-4 mr-2" />
              Free Trial - No Signup Required
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>View {remainingViews} free PDF{remainingViews !== 1 ? 's' : ''}</span>
              {hasUsedFreeTrial && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-orange-600">Trial used - signup for unlimited access</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="mb-8 relative">
          <div className="relative">
            {/* Glowing background for the search area only */}
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl blur opacity-30 animate-pulse"></div>
            
            <div className="relative flex gap-4 p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-4 border-orange-400 shadow-2xl">
              <Input
                placeholder="Enter chemical name, product, or manufacturer (e.g., Acetone, 3M Scotch-Weld, Loctite 242...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 text-base md:text-xl py-6 px-4 border-3 border-orange-300 focus:border-red-500 focus:ring-4 focus:ring-orange-200 bg-white shadow-lg font-medium placeholder:text-gray-600 placeholder:font-semibold"
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                size="lg"
                className="px-2 md:px-8 py-3 md:py-6 text-xs md:text-lg bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 hover:from-orange-700 hover:to-red-700 text-white font-black shadow-2xl transform transition-all hover:scale-110 border-2 border-white"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin w-3 md:w-5 h-3 md:h-5 mr-1 md:mr-2 border-2 border-white border-t-transparent rounded-full" />
                    <span className="hidden sm:inline">SEARCHING...</span>
                    <span className="sm:hidden">SEARCH</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3 md:w-5 h-3 md:h-5 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">SEARCH SDS NOW</span>
                    <span className="sm:hidden">SEARCH</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {searchResults.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Found {searchResults.length} results • Try the full system with unlimited searches
            </p>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-center">Search Results</h3>
            <div className="grid gap-4">
              {searchResults.map((result, index) => (
                <Card key={index} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">
                          {result.product_name}
                        </h4>
                        {result.manufacturer && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.manufacturer}
                          </p>
                        )}
                        <div className="flex gap-2 text-xs">
                          {result.cas_number && (
                            <Badge variant="outline">CAS: {result.cas_number}</Badge>
                          )}
                          {result.signal_word && (
                            <Badge variant="outline">{result.signal_word}</Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant={hasUsedFreeTrial ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleViewPdf(result)}
                        className="ml-4"
                      >
                        {hasUsedFreeTrial ? (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Sign Up to View
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View PDF ({remainingViews} free)
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Signup Prompt */}
        {showSignupPrompt && (
          <Card className="border-primary bg-primary/5 mb-8">
            <CardContent className="p-6 text-center">
              <div className="max-w-md mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  You've experienced the power of instant SDS access!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Get unlimited searches, label printing, incident tracking, and AI safety assistance.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleGetStarted} size="lg" className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Get Free Facility Account
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Set up takes 2 minutes • No credit card required
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Instant Search</h4>
            <p className="text-sm text-muted-foreground">
              Search thousands of SDS documents in seconds
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">OSHA Compliant</h4>
            <p className="text-sm text-muted-foreground">
              Generate compliant chemical labels automatically
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">White-label Branding</h4>
            <p className="text-sm text-muted-foreground">
              Customize with your company's branding and logo
            </p>
          </div>
        </div>
        
        {/* Alternative CTA for non-searchers */}
        {searchResults.length === 0 && !showSignupPrompt && (
          <div className="text-center mt-12">
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-12 py-6 text-xl font-bold"
            >
              Start Free Trial
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
