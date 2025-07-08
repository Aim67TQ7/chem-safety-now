
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CTASection = () => {
  const navigate = useNavigate();
  const [email] = useState("");

  const handleGetStarted = () => {
    if (email) {
      navigate(`/signup?email=${encodeURIComponent(email)}`);
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-primary/5 to-blue-600/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-xl">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to eliminate safety paperwork forever?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join 500+ facilities who've already made the switch. Complete setup in under 2 minutes.
          </p>
          
          <Button 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-12 py-6 text-xl font-bold mb-6"
          >
            Start Free Trial - No Credit Card Required
          </Button>
          
          {/* Testimonial */}
          <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-muted-foreground italic mb-3">
              "We went from 2 hours of searching for safety sheets to 10 seconds. Our safety manager actually thanked us for the first time ever."
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">MF</span>
              </div>
              <span className="font-semibold text-foreground">Mike Foster</span>
              <span className="text-muted-foreground">• Safety Manager, Industrial Corp</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
