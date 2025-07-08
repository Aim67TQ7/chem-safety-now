import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Shield, HeadphonesIcon } from 'lucide-react';

const FAQSection = () => {
  const faqs = [
    {
      question: "What if I can't find my SDS?",
      answer: "We'll upload it for you, free, within 24 hours. Just send us the product name and manufacturer.",
      icon: <Clock className="w-5 h-5 text-green-600" />,
      badge: "Free Service"
    },
    {
      question: "How secure is our data?",
      answer: "Enterprise-grade security with OSHA compliance. Your data is encrypted and never shared.",
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      badge: "OSHA Compliant"
    },
    {
      question: "What if we have technical issues?",
      answer: "24/7 support with 2-hour response guarantee. Setup assistance included free.",
      icon: <HeadphonesIcon className="w-5 h-5 text-purple-600" />,
      badge: "24/7 Support"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Common Questions, Instant Answers
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We've thought through the objections so you don't have to worry
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {faqs.map((faq, index) => (
            <Card key={index} className="border border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  {faq.icon}
                  <Badge variant="outline" className="text-xs">
                    {faq.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Statement */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">100% Money-Back Guarantee • No Setup Fees • Cancel Anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;