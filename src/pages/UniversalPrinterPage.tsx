import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Printer, QrCode, FileText, Zap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import UniversalLabelPrinter from "@/components/UniversalLabelPrinter";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const UniversalPrinterPage = () => {
  const navigate = useNavigate();
  const { facilitySlug } = useParams();
  const [activeTab, setActiveTab] = useState<'labels' | 'qr-codes'>('labels');

  // Fetch facility data if facilitySlug is provided
  const { data: facility } = useQuery({
    queryKey: ["facility", facilitySlug],
    queryFn: async () => {
      if (!facilitySlug) return null;
      
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("slug", facilitySlug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!facilitySlug,
  });

  const handleGoBack = () => {
    if (facility) {
      navigate(`/facility/${facilitySlug}`);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Universal Printer</h1>
              <p className="text-muted-foreground">
                Print GHS safety labels and QR codes with Zebra thermal printers or standard Windows printing
              </p>
              {facility && (
                <Badge variant="outline" className="mt-2">
                  {facility.facility_name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'labels' | 'qr-codes')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="labels" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  GHS Safety Labels
                </TabsTrigger>
                <TabsTrigger value="qr-codes" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Codes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="labels" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">GHS Safety Label Printing</h3>
                    <p className="text-blue-700 text-sm mb-4">
                      Create OSHA-compliant safety labels with hazard pictograms, HMIS ratings, and product information.
                      Supports both Zebra thermal printers and standard Windows printing.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Zap className="h-4 w-4" />
                      <span>Supports Zebra ZD420, ZD620, ZD421, and other Browser Print compatible models</span>
                    </div>
                  </div>
                  
                  <UniversalLabelPrinter />
                </div>
              </TabsContent>

              <TabsContent value="qr-codes" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">QR Code Generation & Printing</h3>
                    <p className="text-green-700 text-sm mb-4">
                      Generate QR codes for quick access to SDS documents, facility information, or custom URLs.
                      Print with high resolution using thermal or standard printers.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <QrCode className="h-4 w-4" />
                      <span>High-resolution QR codes optimized for industrial use</span>
                    </div>
                  </div>
                  
                  {facility && (
                    <QRCodeGenerator 
                      facilityData={{
                        id: facility.id,
                        slug: facility.slug,
                        facility_name: facility.facility_name,
                        logo_url: facility.logo_url,
                        contact_name: facility.contact_name,
                        email: facility.email,
                        address: facility.address
                      }}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Printer Support Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported Printers & Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-primary">Zebra Thermal Printers</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• ZD420, ZD620, ZD421 series</li>
                  <li>• Direct thermal or thermal transfer printing</li>
                  <li>• High-speed printing with precise alignment</li>
                  <li>• Automatic label size detection</li>
                  <li>• Browser Print API integration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-primary">Standard Windows Printing</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Any Windows-compatible printer</li>
                  <li>• High-resolution PNG export</li>
                  <li>• Print preview functionality</li>
                  <li>• Custom paper sizes supported</li>
                  <li>• Browser print dialog integration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UniversalPrinterPage;