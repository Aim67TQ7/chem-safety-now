
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { navItems } from '@/nav-items';
import { CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';

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
    '/qr-print/:facilitySlug',
    '/admin',
    '/admin/sds-documents',
    '/upgrade',
    '/sales-partner',
    '/sales-partner-terms',
    '/signup',
    '/privacy',
    '/terms'
  ];

  // Define which routes should be discoverable by search engines
  const defaultDiscoverableRoutes = [
    '/',
    '/signup',
    '/privacy',
    '/terms',
    '/sales-partner',
    '/sales-partner-terms'
  ];

  const [discoverableRoutes, setDiscoverableRoutes] = useState<string[]>(defaultDiscoverableRoutes);

  const getRouteStatus = (route: string) => {
    if (workingRoutes.includes(route)) {
      return { status: 'working', color: 'green' };
    }
    return { status: 'broken', color: 'red' };
  };

  const toggleDiscoverable = (route: string) => {
    setDiscoverableRoutes(prev => {
      if (prev.includes(route)) {
        return prev.filter(r => r !== route);
      } else {
        return [...prev, route];
      }
    });
  };

  const isDiscoverable = (route: string) => discoverableRoutes.includes(route);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Site Map - All Routes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Toggle which pages are discoverable by search engines. Protected routes should remain non-discoverable.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {navItems.map((item, index) => {
              const routeStatus = getRouteStatus(item.to);
              const StatusIcon = routeStatus.status === 'working' ? CheckCircle : AlertCircle;
              
              const discoverable = isDiscoverable(item.to);
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <code className="text-xs text-gray-500">{item.to}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        {discoverable ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {discoverable ? 'Public' : 'Hidden'}
                        </span>
                        <Switch
                          checked={discoverable}
                          onCheckedChange={() => toggleDiscoverable(item.to)}
                          disabled={item.to.includes('admin') || item.to.includes('facility') || item.to.includes('qr-print') || item.to.includes('upgrade')}
                        />
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
                </div>
              );
            })}
            
            {/* Additional Admin Routes */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4" />
                <div>
                  <div className="font-medium">Admin SDS Documents</div>
                  <code className="text-xs text-gray-500">/admin/sds-documents</code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <Badge variant="default" className="text-xs">Working</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">✅ Recently Fixed Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><code>/qr-print/:facilitySlug</code> - QR print functionality now works with facility slugs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><code>/admin</code> - Admin dashboard page is fully functional</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><code>/upgrade</code> - Subscription upgrade page created</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><code>/sales-partner</code> - Sales partner page created</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><code>/sales-partner-terms</code> - Sales partner terms page created</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><code>/admin/sds-documents</code> - Admin SDS documents page route established</span>
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
          <p><strong>Working Routes:</strong> These routes have corresponding page components that exist and function properly</p>
          <p><strong>Fixed Issues:</strong> QR print functionality now uses facility slugs instead of UUIDs for proper routing</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteMapDisplay;
