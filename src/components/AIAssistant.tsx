
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Send, Bot, User, AlertCircle, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { interactionLogger } from "@/services/interactionLogger";
import { supabase } from "@/integrations/supabase/client";

interface AIAssistantProps {
  facilityData: any;
  selectedDocument?: any;
  onGenerateLabel?: (document: any) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant = ({ facilityData, selectedDocument, onGenerateLabel }: AIAssistantProps) => {
  const getInitialMessage = () => {
    let content = `Hi there! I'm Sarah, your Safety Manager. I'm here to help you with any safety questions you have about chemicals, PPE, procedures, or workplace safety.`;
    
    if (selectedDocument) {
      content += `\n\nI can see you're working with **${selectedDocument.product_name}**${selectedDocument.manufacturer ? ` from ${selectedDocument.manufacturer}` : ''}. I have the complete SDS data for this chemical, so I can give you specific guidance on handling, storage, PPE requirements, and emergency procedures.`;
    } else {
      content += `\n\nFeel free to search for a specific chemical to get detailed guidance, or ask me general safety questions. I'm here to help keep you and your team safe!`;
    }
    
    content += `\n\nWhat can I help you with today?`;
    return content;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: getInitialMessage(),
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const getContextualExampleQueries = () => {
    if (selectedDocument) {
      const productName = selectedDocument.product_name;
      return [
        `What PPE do I need when handling ${productName}?`,
        `How should I store ${productName} safely?`,
        `What should I do if ${productName} spills?`,
        `Are there any special ventilation requirements for ${productName}?`,
        `What's the first aid procedure if someone gets ${productName} on their skin?`,
        `Can I mix ${productName} with other chemicals?`
      ];
    }
    
    return [
      "What PPE should I use for handling corrosive chemicals?",
      "How do I set up proper ventilation for spray operations?",
      "What's the best way to train new employees on chemical safety?",
      "How often should we review our emergency procedures?",
      "What are the key things to look for during a safety inspection?",
      "How do I determine if two chemicals are compatible?"
    ];
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const questionStartTime = Date.now();

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Log the user question with document context
    await interactionLogger.logFacilityUsage({
      eventType: 'ai_question_asked',
      eventDetail: {
        question: currentMessage,
        messageCount: messages.length + 1,
        productName: selectedDocument?.product_name,
        documentId: selectedDocument?.id
      }
    });

    const questionContent = currentMessage;
    setCurrentMessage("");
    setIsProcessing(true);

    try {
      // Prepare conversation history for the AI
      const conversationHistory = messages.slice(1).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      console.log('🤖 Calling AI Safety Chat function...');

      const { data, error } = await supabase.functions.invoke('ai-safety-chat', {
        body: {
          message: questionContent,
          conversation_history: conversationHistory,
          sds_document: selectedDocument,
          facility_data: facilityData
        }
      });

      if (error) {
        console.error('❌ AI function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (!data?.response) {
        throw new Error('No response received from AI');
      }

      const responseTime = Date.now() - questionStartTime;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Log the AI conversation with document context
      await interactionLogger.logAIConversation({
        question: questionContent,
        response: data.response,
        responseTimeMs: responseTime,
        metadata: {
          messageCount: messages.length + 2,
          responseType: 'conversational_ai',
          productName: selectedDocument?.product_name,
          documentId: selectedDocument?.id,
          usage: data.usage
        }
      });

    } catch (error) {
      console.error('AI Assistant error:', error);
      
      await interactionLogger.logFacilityUsage({
        eventType: 'ai_response_error',
        eventDetail: {
          question: questionContent,
          error: error.message
        }
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or contact your safety officer if you have an urgent safety concern.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Connection Issue",
        description: "Unable to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const useExampleQuery = async (query: string) => {
    setCurrentMessage(query);
    
    await interactionLogger.logFacilityUsage({
      eventType: 'ai_example_query_selected',
      eventDetail: {
        query: query,
        productName: selectedDocument?.product_name,
        documentId: selectedDocument?.id
      }
    });
  };

  // Enhanced markdown renderer for better formatting
  const renderMarkdown = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  const handleGenerateEnhancedLabel = async () => {
    if (!selectedDocument || !onGenerateLabel) return;

    try {
      // First, enhance the SDS data with AI if not already done
      if (!selectedDocument.ai_extracted_data || selectedDocument.ai_extraction_confidence < 70) {
        console.log('🤖 Enhancing SDS data with AI before label generation...');
        
        const { data, error } = await supabase.functions.invoke('ai-enhanced-sds-extraction', {
          body: { document_id: selectedDocument.id }
        });

        if (error) {
          console.error('AI enhancement error:', error);
          // Continue with basic data if AI enhancement fails
        } else if (data?.success) {
          console.log(`✅ AI enhancement completed with ${data.confidence}% confidence`);
        }
      }

      // Log the AI-enhanced label generation
      await interactionLogger.logSDSInteraction({
        sdsDocumentId: selectedDocument.id,
        actionType: 'generate_label_from_ai',
        metadata: {
          productName: selectedDocument.product_name,
          aiEnhanced: true,
          confidence: selectedDocument.ai_extraction_confidence || 0
        }
      });

      // Generate the label
      onGenerateLabel(selectedDocument);
      
      toast({
        title: "AI-Enhanced Label Ready",
        description: `Generating label with AI-extracted safety data for ${selectedDocument.product_name}`,
      });

    } catch (error) {
      console.error('Enhanced label generation error:', error);
      toast({
        title: "Error",
        description: "Unable to generate enhanced label. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Chat Messages - Now with proper height management */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {message.type === 'user' ? (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage 
                      src="/lovable-uploads/f96c7ce3-ace7-434d-a4a6-fcec5716efa8.png" 
                      alt="Sarah - Safety Manager"
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Bot className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}>
                  <div 
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                  />
                  <div className={`text-xs mt-2 opacity-70 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage 
                    src="/lovable-uploads/f96c7ce3-ace7-434d-a4a6-fcec5716efa8.png" 
                    alt="Sarah - Safety Manager"
                  />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Bot className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse text-sm text-gray-600">Sarah is thinking...</div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex space-x-3">
            <Input
              type="text"
              placeholder="Ask Sarah about chemical safety, PPE, procedures..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-sm bg-white"
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Enhanced Quick Actions for Selected Document */}
      {selectedDocument && onGenerateLabel && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
            <Printer className="w-4 h-4 mr-2" />
            🤖 AI-Enhanced Actions for {selectedDocument.product_name}
          </h4>
          
          <div className="space-y-2">
            <Button
              onClick={handleGenerateEnhancedLabel}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              size="sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Generate AI-Enhanced GHS Label
            </Button>
            
            <p className="text-xs text-gray-600">
              This will use AI to extract accurate HMIS ratings, PPE requirements, and chemical data for your safety label.
            </p>
          </div>
        </Card>
      )}

      {/* Contextual Example Queries */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
          {selectedDocument ? `Common Questions About ${selectedDocument.product_name}` : 'Popular Safety Topics'}
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {getContextualExampleQueries().map((query, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => useExampleQuery(query)}
              className="text-left justify-start h-auto p-3 whitespace-normal text-xs hover:bg-blue-50 hover:border-blue-300"
              disabled={isProcessing}
            >
              {query}
            </Button>
          ))}
        </div>
      </Card>

      {/* Professional Disclaimer */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Safety Notice
        </h4>
        
        <p className="text-xs text-amber-800">
          Sarah provides guidance based on SDS data and general safety practices. For site-specific applications, 
          emergency situations, or complex scenarios, always consult your facility's safety procedures and qualified safety professionals. 
          This assistant supplements but does not replace proper safety training and local expertise.
        </p>
      </Card>
    </div>
  );
};

export default AIAssistant;
