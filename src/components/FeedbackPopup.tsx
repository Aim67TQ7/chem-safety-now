
import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FeedbackService } from "@/services/feedbackService";
import { toast } from "sonner";

interface FeedbackPopupProps {
  facilityId: string;
  facilityName: string;
}

const FeedbackPopup = ({ facilityId, facilityName }: FeedbackPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'comment' | 'suggestion' | 'problem'>('comment');
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error("Please enter your feedback message");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await FeedbackService.submitFeedback(
        facilityId,
        feedbackType,
        message,
        contactInfo
      );

      if (success) {
        toast.success("Thank you for your feedback! We'll review it soon.");
        setMessage('');
        setContactInfo('');
        setIsOpen(false);
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'problem':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'suggestion':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg"
          size="sm"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96">
      <Card className="shadow-xl border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg">Share Feedback</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            Help us improve <strong>{facilityName}</strong>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Feedback Type</Label>
              <div className="flex gap-2 mt-2">
                {(['comment', 'suggestion', 'problem'] as const).map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      feedbackType === type 
                        ? getTypeColor(type)
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setFeedbackType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="message" className="text-sm font-medium">
                Your Message *
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us what's on your mind..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 min-h-[80px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="contact" className="text-sm font-medium">
                Contact Info (Optional)
              </Label>
              <Input
                id="contact"
                placeholder="Email or phone (if you'd like a response)"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackPopup;
