
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Monitor, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface DesktopLinkGeneratorProps {
  facilityData: {
    id: string;
    slug: string;
    facility_name: string | null;
    logo_url?: string;
  };
}

const DesktopLinkGenerator = ({ facilityData }: DesktopLinkGeneratorProps) => {
  const [linkTitle, setLinkTitle] = useState(facilityData.facility_name || "ChemLabel-GPT Access");
  const [generating, setGenerating] = useState(false);

  const facilityUrl = `https://chemlabel-gpt.com/facility/${facilityData.slug}`;

  const generateDesktopFile = () => {
    setGenerating(true);
    
    try {
      // Create Windows .url file content
      const urlFileContent = `[InternetShortcut]
URL=${facilityUrl}
IconFile=${facilityData.logo_url || 'https://chemlabel-gpt.com/favicon.ico'}
IconIndex=0`;

      // Create and download the .url file
      const blob = new Blob([urlFileContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${linkTitle.replace(/[^a-zA-Z0-9]/g, '_')}.url`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Desktop link file downloaded successfully!");
    } catch (error) {
      console.error('Error generating desktop file:', error);
      toast.error("Failed to generate desktop link file");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(facilityUrl).then(() => {
      toast.success("Facility URL copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy URL");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="w-5 h-5" />
          <span>Desktop Access Link</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="link-title">Link Title</Label>
          <Input
            id="link-title"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            placeholder="Enter title for desktop link"
          />
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <Label className="text-sm font-medium">Facility URL:</Label>
          <div className="flex items-center space-x-2 mt-1">
            <code className="text-sm bg-white p-2 rounded border flex-1 truncate">
              {facilityUrl}
            </code>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={copyToClipboard}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={generateDesktopFile}
            disabled={generating}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {generating ? "Generating..." : "Download Desktop Link"}
          </Button>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Creates a Windows desktop shortcut (.url file)</p>
            <p>• Double-click the downloaded file to access your facility</p>
            <p>• Share this file with employees for quick access</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DesktopLinkGenerator;
