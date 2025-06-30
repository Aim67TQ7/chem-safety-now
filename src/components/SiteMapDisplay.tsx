
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { navItems } from '@/nav-items';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const SiteMapDisplay = () => {
  // Define which routes actually exist and work
  const workingRoutes = [
    '/',
    '/facility/:facilitySlug',
    '/facility/:facilitySlug/settings',
    '/facility/:facilitySlug/sds-documents',
    '/facility/:facilitySlug/incidents',
    '/facility/:facilitySlug/access-tools',
    '/facility/:facilitySlug/label-printer',
    '/qr-print',
    '/signup',
    '/privacy',
    '/terms'
  ];

  const getRouteStatus = (route: string) => {
    if (workingRoutes.includes(route)) {
      return { status: 'working', color: 'green' };
    }
    return { status: 'broken', color: 'red' };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Site Map - All Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {navItems.map((item, index) => {
              const routeStatus = getRouteStatus(item.to);
              const StatusIcon = routeStatus.status === 'working' ? CheckCircle : AlertCircle;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <code className="text-xs text-gray-500">{item.to}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon 
                      className={`w-4 h-4 ${routeStatus.color === 'green' ? 'text-green-600' : 'text-red-600'}`} 
                    />
                    <Badge 
                      variant={routeStatus.status === 'working' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {routeStatus.status === 'working' ? 'Working' : 'Needs Fix'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Missing Pages That Need Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span><code>/admin</code> - Admin dashboard page</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span><code>/upgrade</code> - Subscription upgrade page</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span><code>/sales-partner</code> - Sales partner page</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span><code>/sales-partner-terms</code> - Sales partner terms page</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span><code>/qr-print/:facilitySlug</code> - Individual facility QR print page</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Route Patterns Explanation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>:facilitySlug</strong> - This should be a human-readable facility identifier (like "acme-corp"), not a UUID</p>
          <p><strong>Working Routes:</strong> These routes have corresponding page components that exist</p>
          <p><strong>Broken Routes:</strong> These routes are defined in nav-items.tsx but missing their page components</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteMapDisplay;
