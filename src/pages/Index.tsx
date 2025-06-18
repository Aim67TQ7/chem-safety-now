
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Tag, MessageSquare, QrCode, Database } from "lucide-react";
import { Link } from "react-router-dom";
import SDSSearch from "@/components/SDSSearch";
import LabelPrinter from "@/components/LabelPrinter";
import AIAssistant from "@/components/AIAssistant";
import QRCodeGenerator from "@/components/QRCodeGenerator";

const Index = () => {
  const [activeTab, setActiveTab] = useState("sds");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ChemLabel GPT
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive chemical safety platform with AI-powered SDS search, 
            intelligent label generation, and safety assistance.
          </p>
          
          <div className="mt-6">
            <Link to="/sds-documents">
              <Button variant="outline" className="mr-4">
                <Database className="h-4 w-4 mr-2" />
                View SDS Library
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="sds" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              SDS Search
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Label Printer
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sds">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Safety Data Sheet Search
                </CardTitle>
                <CardDescription>
                  Search for chemical safety data sheets with AI-powered matching and quality validation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SDSSearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labels">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Chemical Label Generator
                </CardTitle>
                <CardDescription>
                  Generate GHS-compliant labels for chemical containers with hazard codes and pictograms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LabelPrinter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Safety Assistant
                </CardTitle>
                <CardDescription>
                  Get instant answers to chemical safety questions from our AI expert.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIAssistant />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Generator
                </CardTitle>
                <CardDescription>
                  Create QR codes for quick access to facility safety information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRCodeGenerator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
