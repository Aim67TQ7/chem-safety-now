
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Tag, MessageSquare, QrCode, Database, Building2, Shield, Search } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ChemLabel GPT
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Your comprehensive chemical safety platform with AI-powered SDS search, 
            intelligent label generation, and safety assistance. Create custom facility pages 
            for your organization with QR code access.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link to="/sds-documents">
              <Button variant="default" size="lg">
                <Database className="h-5 w-5 mr-2" />
                Browse SDS Library
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" size="lg">
                <Building2 className="h-5 w-5 mr-2" />
                Create Facility Page
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                AI-Powered SDS Search
              </CardTitle>
              <CardDescription>
                Find safety data sheets instantly with intelligent search and quality validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Advanced AI matching ensures you find the right SDS documents quickly and accurately.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-green-600" />
                GHS Label Generation
              </CardTitle>
              <CardDescription>
                Create compliant chemical labels with proper hazard codes and pictograms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Automatically generate professional labels that meet regulatory standards.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                AI Safety Assistant
              </CardTitle>
              <CardDescription>
                Get instant answers to chemical safety questions from our expert AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Real-time safety guidance and recommendations for chemical handling.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-orange-600" />
                QR Code Access
              </CardTitle>
              <CardDescription>
                Quick facility access via QR codes for mobile safety information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Mobile-friendly access to your facility's safety resources anywhere.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-600" />
                Custom Facility Pages
              </CardTitle>
              <CardDescription>
                White-label facility pages with your branding and information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Personalized safety portals for your organization's specific needs.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                Compliance Ready
              </CardTitle>
              <CardDescription>
                Built to meet safety regulations and industry standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Ensure your facility meets all chemical safety compliance requirements.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>
                Create your custom facility page or explore our SDS document library.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  <Building2 className="h-5 w-5 mr-2" />
                  Set Up Your Facility
                </Button>
              </Link>
              <Link to="/sds-documents">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <FileText className="h-5 w-5 mr-2" />
                  Explore SDS Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
