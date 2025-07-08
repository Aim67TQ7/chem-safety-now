import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, CheckCircle, Star } from 'lucide-react';

const TrustSection = () => {
  return (
    <section className="py-12 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-6">Trusted by safety managers at leading facilities</p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-8">
            <Badge variant="outline" className="px-4 py-2 bg-green-50 border-green-200 text-green-800">
              <Shield className="w-4 h-4 mr-2" />
              OSHA Compliant
            </Badge>
            <Badge variant="outline" className="px-4 py-2 bg-blue-50 border-blue-200 text-blue-800">
              <Users className="w-4 h-4 mr-2" />
              500+ Facilities
            </Badge>
            <Badge variant="outline" className="px-4 py-2 bg-purple-50 border-purple-200 text-purple-800">
              <CheckCircle className="w-4 h-4 mr-2" />
              99.9% Uptime
            </Badge>
            <Badge variant="outline" className="px-4 py-2 bg-yellow-50 border-yellow-200 text-yellow-800">
              <Star className="w-4 h-4 mr-2" />
              50,000+ SDS Searches
            </Badge>
          </div>

          {/* Social Proof */}
          <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">15 hours</div>
              <p>Average weekly time saved per facility</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">Under 10 sec</div>
              <p>Average SDS search time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">2 minutes</div>
              <p>Complete facility setup time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;