
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
    <section className="py-20 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* CTA section content removed */}
      </div>
    </section>
  );
};

export default CTASection;
