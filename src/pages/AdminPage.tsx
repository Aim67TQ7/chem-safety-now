
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import AdminFeedbackPanel from "@/components/AdminFeedbackPanel";
import AdminTrialTabs from "@/components/AdminTrialTabs";

const AdminPage = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const navigate = useNavigate();
  
  // Secret password to access admin page - in a real app, use better auth!
  const SECRET_ADMIN_PASSWORD = "chemlabel2025";

  useEffect(() => {
    const storedAuth = sessionStorage.getItem("adminAuthorized");
    if (storedAuth === "true") {
      setAuthorized(true);
      fetchFacilityData();
    }
  }, []);

  const handleAuthenticate = () => {
    if (authPassword === SECRET_ADMIN_PASSWORD) {
      setAuthorized(true);
      sessionStorage.setItem("adminAuthorized", "true");
      // Store admin email for action tracking
      sessionStorage.setItem("adminEmail", "admin@chemlabel-gpt.com");
      fetchFacilityData();
    } else {
      toast.error("Invalid password");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  }

  const fetchFacilityData = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_facility_overview')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setFacilities(data || []);
    } catch (error: any) {
      console.error("Error fetching facilities:", error);
      toast.error("Error loading facility data");
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Lock className="h-5 w-5" /> Admin Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="text-sm font-medium">
                  Admin Password
                </label>
                <input 
                  type="password" 
                  id="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                />
              </div>
              <Button className="w-full" onClick={handleAuthenticate}>
                Authenticate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={() => {
            sessionStorage.removeItem("adminAuthorized");
            sessionStorage.removeItem("adminEmail");
            setAuthorized(false);
            navigate("/");
          }}
        >
          Exit Admin Mode
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback Panel - Left Column */}
        <div className="lg:col-span-1">
          <AdminFeedbackPanel />
        </div>

        {/* Facility Overview with Tabs - Right Columns */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <AdminTrialTabs 
              facilities={facilities} 
              onStatusUpdate={fetchFacilityData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
