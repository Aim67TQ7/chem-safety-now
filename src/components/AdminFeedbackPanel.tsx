
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, AlertCircle, Lightbulb, Clock, Eye, CheckCircle } from "lucide-react";
import { FeedbackService, FeedbackWithFacility } from "@/services/feedbackService";
import { toast } from "sonner";

const AdminFeedbackPanel = () => {
  const [feedback, setFeedback] = useState<FeedbackWithFacility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const data = await FeedbackService.getFeedbackForAdmin();
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (feedbackId: string, status: 'new' | 'reviewed' | 'resolved') => {
    const success = await FeedbackService.updateFeedbackStatus(feedbackId, status);
    if (success) {
      setFeedback(prev => 
        prev.map(item => 
          item.id === feedbackId ? { ...item, status } : item
        )
      );
      toast.success(`Feedback marked as ${status}`);
    } else {
      toast.error('Failed to update status');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'problem':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reviewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const newFeedbackCount = feedback.filter(item => item.status === 'new').length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          User Feedback
          {newFeedbackCount > 0 && (
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
              {newFeedbackCount} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading feedback...</div>
          ) : feedback.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No feedback yet</div>
          ) : (
            <div className="space-y-4 p-6">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 space-y-3 ${
                    item.status === 'new' ? 'border-yellow-200 bg-yellow-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.feedback_type)}
                      <span className="font-medium capitalize">
                        {item.feedback_type}
                      </span>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {getStatusIcon(item.status)}
                        {item.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {item.facility_name}
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {item.message}
                    </div>
                    {item.contact_info && (
                      <div className="text-xs text-blue-600 mt-2">
                        Contact: {item.contact_info}
                      </div>
                    )}
                  </div>

                  {item.status !== 'resolved' && (
                    <div className="flex gap-2">
                      {item.status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(item.id, 'reviewed')}
                          className="text-xs"
                        >
                          Mark Reviewed
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(item.id, 'resolved')}
                        className="text-xs"
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminFeedbackPanel;
