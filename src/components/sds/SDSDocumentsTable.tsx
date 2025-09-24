import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, Printer, Eye, Clock } from 'lucide-react';
import { useSDSDocuments } from '@/hooks/useSDSDocuments';
import { formatDistanceToNow } from 'date-fns';

interface SDSDocumentsTableProps {
  facilityId: string;
  facilitySlug?: string;
  onViewDocument?: (document: any) => void;
  onPrintLabel?: (document: any) => void;
}

const SDSDocumentsTable: React.FC<SDSDocumentsTableProps> = ({
  facilityId,
  facilitySlug,
  onViewDocument,
  onPrintLabel
}) => {
  const {
    documents,
    totalCount,
    isLoading,
    error
  } = useSDSDocuments({
    searchTerm: '',
    filterType: 'all',
    filterStatus: 'all',
    pageSize: 100,
    facilityId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your SDS Documents
          </CardTitle>
          <CardDescription>
            SDS documents your facility has accessed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your SDS Documents
          </CardTitle>
          <CardDescription>
            Error loading SDS documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load documents. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (document: any) => {
    if (document.extraction_status === 'completed') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
    }
    if (document.extraction_status === 'manual_review_required') {
      return <Badge variant="destructive">Needs Review</Badge>;
    }
    if (document.extraction_status === 'pending') {
      return <Badge variant="secondary">Processing</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getConfidenceIndicator = (confidence: number | null) => {
    if (!confidence) return null;
    
    if (confidence >= 80) {
      return <Badge variant="default" className="bg-green-100 text-green-800">High Quality</Badge>;
    }
    if (confidence >= 60) {
      return <Badge variant="secondary">Good Quality</Badge>;
    }
    return <Badge variant="outline">Basic Quality</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Your SDS Documents
        </CardTitle>
        <CardDescription>
          SDS documents your facility has accessed ({totalCount} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No SDS Documents Yet
            </h3>
            <p className="text-muted-foreground">
              Search for and access SDS documents above to see them listed here.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>CAS Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Accessed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="font-medium">{document.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {document.signal_word && (
                          <Badge variant="outline" className="mt-1">
                            {document.signal_word}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {document.manufacturer || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {document.cas_number || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(document)}
                        {getConfidenceIndicator(document.ai_extraction_confidence)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDocument?.(document)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPrintLabel?.(document)}
                          className="h-8 w-8 p-0"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = document.bucket_url || document.source_url;
                            window.open(url, '_blank');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SDSDocumentsTable;