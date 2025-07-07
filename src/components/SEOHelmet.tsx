
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEOHelmet = () => {
  const location = useLocation();

  useEffect(() => {
    // Block indexing of protected routes
    const protectedRoutes = ['/admin', '/facility', '/qr-print', '/sales-rep', '/upgrade', '/subscription'];
    const isProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));
    
    // Get or create robots meta tag
    let robotsTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsTag) {
      robotsTag = document.createElement('meta');
      robotsTag.name = 'robots';
      document.head.appendChild(robotsTag);
    }
    
    if (isProtectedRoute) {
      // Block indexing for protected routes
      robotsTag.content = 'noindex, nofollow, noarchive, nosnippet';
      
      // Add additional privacy headers for admin/customer areas
      const existingNoIndex = document.querySelector('meta[name="googlebot"]');
      if (!existingNoIndex) {
        const googleBotTag = document.createElement('meta');
        googleBotTag.name = 'googlebot';
        googleBotTag.content = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
        document.head.appendChild(googleBotTag);
      }
      
    } else {
      // Allow indexing for public routes
      robotsTag.content = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
      
      // Remove googlebot restriction if it exists
      const googleBotTag = document.querySelector('meta[name="googlebot"]');
      if (googleBotTag) {
        googleBotTag.remove();
      }
    }
    
    // Update page title for better SEO on public pages
    if (location.pathname === '/') {
      document.title = 'QRsafetyapp.com – AI-Powered SDS Lookup & OSHA Chemical Safety Management';
    } else if (location.pathname === '/signup') {
      document.title = 'Sign Up - QRsafetyapp.com SDS Lookup & Chemical Safety Platform';
    }
    
  }, [location.pathname]);

  return null;
};

export default SEOHelmet;
