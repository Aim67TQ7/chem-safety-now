
import { useState } from 'react';
import { RadioGroup } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SDSSearchInput from "./SDSSearchInput";
import SDSResultCard from "./SDSResultCard";
import EnhancedSDSSearchCard from "./EnhancedSDSSearchCard";

interface SDSSearchProps {
  facilityId: string;
}

const SDSSearch = ({ facilityId }: SDSSearchProps) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    if (results.length > 0) {
      setSelectedDocument(results[0].id || results[0].source_url);
    }
  };

  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchResults([]);
    setSelectedDocument('');
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document.id || document.source_url);
  };

  const handleViewDocument = (document: any) => {
    console.log('👁️ Viewing document:', document.product_name);
    if (document.bucket_url) {
      window.open(document.bucket_url, '_blank');
    } else if (document.source_url) {
      window.open(document.source_url, '_blank');
    }
  };

  const handleDownloadDocument = async (document: any) => {
    try {
      setIsDownloading(true);
      console.log('📥 Downloading document:', document.product_name);
      
      if (document.bucket_url) {
        window.open(document.bucket_url, '_blank');
        toast.success(`Opening PDF for ${document.product_name}`);
        return;
      }

      const response = await supabase.functions.invoke('download-sds-pdf', {
        body: { 
          document_id: document.id || crypto.randomUUID(),
          source_url: document.source_url,
          file_name: `${document.product_name}_SDS.pdf`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
        toast.success('PDF download started');
      } else {
        window.open(document.source_url, '_blank');
        toast.success(`Opening source document for ${document.product_name}`);
      }
    } catch (error: any) {
      console.error('❌ Download error:', error);
      toast.error(`Failed to download PDF: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <EnhancedSDSSearchCard>
      <SDSSearchInput 
        facilityId={facilityId}
        onSearchResults={handleSearchResults}
        onSearchStart={handleSearchStart}
      />
      
      {isSearching && searchResults.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Searching for SDS documents...</p>
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Found {searchResults.length} SDS Document{searchResults.length > 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-600">
              Select a document to view, download, or extract label data
            </p>
          </div>

          <RadioGroup 
            value={selectedDocument} 
            onValueChange={setSelectedDocument}
            className="space-y-4"
          >
            {searchResults.map((doc, index) => (
              <SDSResultCard
                key={doc.id || doc.source_url || index}
                document={doc}
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                isSelected={selectedDocument === (doc.id || doc.source_url)}
                onSelect={handleDocumentSelect}
                showSelection={true}
                facilityId={facilityId}
              />
            ))}
          </RadioGroup>
        </div>
      )}

      {searchResults.length === 0 && !isSearching && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Enter a product name, material, or manufacturer above to search for Safety Data Sheets
          </p>
        </div>
      )}
    </EnhancedSDSSearchCard>
  );
};

export default SDSSearch;
