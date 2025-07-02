import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SDSDocument {
  id: string;
  product_name: string;
  manufacturer: string;
  extraction_status: string;
  ai_extraction_confidence: number;
  cas_number: string;
}

interface ProductSelectorProps {
  selectedDocumentId?: string;
  onDocumentSelect: (document: SDSDocument | null) => void;
  className?: string;
}

const ProductSelector = ({ selectedDocumentId, onDocumentSelect, className }: ProductSelectorProps) => {
  const [documents, setDocuments] = useState<SDSDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('sds_documents')
        .select('id, product_name, manufacturer, extraction_status, ai_extraction_confidence, cas_number')
        .in('extraction_status', ['osha_compliant', 'manual_review_required', 'completed'])
        .not('product_name', 'is', null)
        .order('product_name');

      if (error) {
        console.error('Error loading SDS documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.cas_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, confidence: number) => {
    switch (status) {
      case 'osha_compliant':
        return <Badge variant="default" className="bg-green-100 text-green-800">OSHA Compliant</Badge>;
      case 'manual_review_required':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Review Required</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSelectChange = (documentId: string) => {
    if (documentId === 'none') {
      onDocumentSelect(null);
      return;
    }
    
    const selectedDoc = documents.find(doc => doc.id === documentId);
    onDocumentSelect(selectedDoc || null);
  };

  const groupedDocuments = filteredDocuments.reduce((groups, doc) => {
    const manufacturer = doc.manufacturer || 'Unknown Manufacturer';
    if (!groups[manufacturer]) {
      groups[manufacturer] = [];
    }
    groups[manufacturer].push(doc);
    return groups;
  }, {} as Record<string, SDSDocument[]>);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading SDS documents...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search products, manufacturers, or CAS numbers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={selectedDocumentId || 'none'} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a product to print labels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Select a product...</SelectItem>
          
          {Object.entries(groupedDocuments).map(([manufacturer, docs]) => (
            <div key={manufacturer}>
              <div className="px-2 py-1 text-sm font-semibold text-gray-700 bg-gray-50">
                {manufacturer} ({docs.length} products)
              </div>
              {docs.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{doc.product_name}</span>
                      {doc.cas_number && (
                        <span className="text-xs text-gray-500">CAS: {doc.cas_number}</span>
                      )}
                    </div>
                    <div className="ml-2">
                      {getStatusBadge(doc.extraction_status, doc.ai_extraction_confidence)}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {filteredDocuments.length === 0 && searchTerm && (
        <div className="text-center text-gray-500 py-4">
          No products found matching "{searchTerm}"
        </div>
      )}

      <div className="text-sm text-gray-600">
        {documents.length} total products available for label printing
      </div>
    </div>
  );
};

export default ProductSelector;