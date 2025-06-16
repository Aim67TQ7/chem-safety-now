import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SDSSearch } from '@/components/SDSSearch';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { interactionLogger } from "@/services/interactionLogger";

const FacilityPage = () => {
  const { facilitySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("search");
  
  const isSetupMode = searchParams.get('setup') === 'true';

  // Mock facility data - in real app this would come from API
  const facilityData = {
    id: "facility-123",
    name: "Bunting Magnetics",
    slug: facilitySlug || "",
    logoUrl: null
  };

  const facilityUrl = `${window.location.origin}/facility/${facilitySlug}`;

  useEffect(() => {
    const initializeLogging = async () => {
      if (facilitySlug) {
        // Set facility context using slug
        await interactionLogger.setFacilityBySlug(facilitySlug);
        
        // Log page visit
        await interactionLogger.logFacilityUsage({
          eventType: 'facility_page_visit',
          eventDetail: { 
            facilitySlug,
            setupMode: isSetupMode,
            tab: activeTab
          },
          facilitySlug
        });
      }
    };

    initializeLogging();
  }, [facilitySlug, isSetupMode, activeTab]);

  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    
    // Log tab change
    await interactionLogger.logFacilityUsage({
      eventType: 'facility_tab_change',
      eventDetail: { 
        previousTab: activeTab, 
        newTab: value 
      },
      facilitySlug
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{facilityData.name}</CardTitle>
          <CardDescription>
            Manage your facility's safety and compliance.
            {isSetupMode && <Badge className="ml-2">Setup Mode</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="search">SDS Search</TabsTrigger>
              <TabsTrigger value="qr">QR Code Generator</TabsTrigger>
              {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
            </TabsList>
            <TabsContent value="search">
              <SDSSearch />
            </TabsContent>
            <TabsContent value="qr">
              <QRCodeGenerator facilityName={facilityData.name} facilityUrl={facilityUrl} />
            </TabsContent>
            {/* <TabsContent value="settings">
              <h2>Settings Content</h2>
              <p>Here you can manage facility settings.</p>
            </TabsContent> */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacilityPage;
