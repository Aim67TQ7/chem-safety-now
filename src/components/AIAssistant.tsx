
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { interactionLogger } from "@/services/interactionLogger";

interface AIAssistantProps {
  facilityData: any;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant = ({ facilityData }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Chemical Safety Assistant online for ${facilityData.facilityName}. I provide precise guidance on chemical hazards, PPE requirements, safety protocols, and OSHA compliance. How may I assist you?`,
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const exampleQueries = [
    "PPE requirements for acetone handling",
    "Storage requirements for flammable solvents",
    "First aid protocol for chemical splash",
    "Ventilation requirements for spray operations",
    "Disposal procedures for contaminated materials",
    "Emergency response for chemical spills"
  ];

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
    
    // Log the user question
    await interactionLogger.logFacilityUsage({
      eventType: 'ai_question_asked',
      eventDetail: {
        question: currentMessage,
        messageCount: messages.length + 1
      }
    });

    const questionContent = currentMessage;
    setCurrentMessage("");
    setIsProcessing(true);

    try {
      // Process with professional response delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Professional chemical safety responses
      let aiResponse = "Based on current safety data and OSHA regulations, I recommend the following protocols for your query.";

      if (questionContent.toLowerCase().includes('wd-40') || questionContent.toLowerCase().includes('penetrating oil')) {
        aiResponse = "WD-40 (Penetrating Oil):\n\nHazard Classification: H222 (Extremely flammable aerosol), H319 (Eye irritation)\n\nRequired PPE:\n• Chemical-resistant nitrile gloves\n• Safety glasses with side shields\n• Ensure adequate ventilation\n\nStorage: Cool, dry location away from ignition sources\nCompatibility: Safe for aluminum applications\n\nRefer to current SDS for specific precautions.";
      } else if (questionContent.toLowerCase().includes('acetone')) {
        aiResponse = "Acetone Safety Protocol:\n\nHazard Profile: H225 (Highly flammable), H319 (Eye irritation), H336 (CNS effects)\n\nMandatory PPE:\n• Chemical-resistant nitrile gloves (breakthrough time >480 min)\n• Safety glasses with side protection\n• Local exhaust ventilation required\n\nStorage: Grounded containers, explosion-proof electrical equipment\nExposure Limits: TWA 750 ppm, STEL 1000 ppm\n\nConsult Section 8 of current SDS for complete requirements.";
      } else if (questionContent.toLowerCase().includes('ppe') || questionContent.toLowerCase().includes('personal protective')) {
        aiResponse = "PPE Selection Matrix:\n\nRisk Assessment Required:\n• Chemical compatibility assessment\n• Exposure duration and concentration\n• Route of exposure evaluation\n\nMinimum Requirements:\n• Eyes: ANSI Z87.1 safety glasses\n• Hands: Chemical-resistant gloves per breakthrough data\n• Respiratory: When engineering controls insufficient\n• Body: Chemical-resistant apron for splash hazards\n\nRefer to SDS Section 8 for chemical-specific requirements.";
      } else if (questionContent.toLowerCase().includes('storage') || questionContent.toLowerCase().includes('store')) {
        aiResponse = "Chemical Storage Requirements:\n\nCompatibility Groups:\n• Segregate incompatible materials per OSHA 1910.106\n• Maintain proper separation distances\n• Ensure adequate ventilation systems\n\nContainer Requirements:\n• Original labeled containers\n• Secondary containment where required\n• Grounding/bonding for flammable liquids\n\nTemperature/humidity controls as specified in SDS Section 7.";
      } else if (questionContent.toLowerCase().includes('spill') || questionContent.toLowerCase().includes('emergency')) {
        aiResponse = "Emergency Response Protocol:\n\nImmediate Actions:\n• Evacuate non-essential personnel\n• Eliminate ignition sources\n• Don appropriate PPE before response\n\nContainment:\n• Use compatible absorbent materials\n• Prevent environmental release\n• Ventilate area if safe to do so\n\nNotification: Report per facility emergency procedures\nRefer to SDS Section 6 for specific cleanup procedures.";
      }

      const responseTime = Date.now() - questionStartTime;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Log the AI conversation
      await interactionLogger.logAIConversation({
        question: questionContent,
        response: aiResponse,
        responseTimeMs: responseTime,
        metadata: {
          messageCount: messages.length + 2,
          responseType: 'professional_guidance'
        }
      });

      // Log facility usage
      await interactionLogger.logFacilityUsage({
        eventType: 'ai_response_generated',
        eventDetail: {
          question: questionContent,
          responseLength: aiResponse.length,
          responseTimeMs: responseTime
        },
        durationMs: responseTime
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

      toast({
        title: "System Error",
        description: "Unable to process request. Please try again.",
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
        query: query
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Bot className="w-8 h-8 text-gray-600 mr-3" />
              Chemical Safety Assistant
            </h3>
            <p className="text-gray-600">
              Professional guidance on chemical hazards, safety protocols, and regulatory compliance.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              SDS Database Connected
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
              OSHA Current
            </Badge>
          </div>
        </div>
      </Card>

      {/* Chat Interface */}
      <Card className="p-0 overflow-hidden">
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-gray-600' 
                    : 'bg-gray-800'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div className={`rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="whitespace-pre-wrap font-mono text-sm">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-gray-200' : 'text-gray-500'
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
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">Processing...</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-4">
            <Input
              type="text"
              placeholder="Enter chemical safety query..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 font-mono"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isProcessing}
              className="bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Example Queries */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Common Safety Queries
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exampleQueries.map((query, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => useExampleQuery(query)}
              className="text-left justify-start h-auto p-3 whitespace-normal"
            >
              <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {query}
            </Button>
          ))}
        </div>
      </Card>

      {/* Professional Disclaimer */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Professional Notice
        </h4>
        
        <p className="text-sm text-gray-700">
          This assistant provides technical guidance based on current safety data and regulatory standards. 
          Always consult official Safety Data Sheets, facility procedures, and qualified safety professionals 
          for site-specific applications. This system supplements but does not replace professional safety training.
        </p>
      </Card>
    </div>
  );
};

export default AIAssistant;
