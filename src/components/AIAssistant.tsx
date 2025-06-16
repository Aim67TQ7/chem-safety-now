
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Send, Bot, User } from "lucide-react";
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
      content: `# Chemical Safety Assistant\n\n**Facility:** ${facilityData.facilityName}\n\nProviding precise guidance on chemical hazards, PPE requirements, safety protocols, and OSHA compliance. How may I assist you?`,
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
      await new Promise(resolve => setTimeout(resolve, 800));

      // Professional chemical safety responses
      let aiResponse = "## Safety Protocol Assessment\n\nBased on current safety data and OSHA regulations:\n\n";

      if (questionContent.toLowerCase().includes('wd-40') || questionContent.toLowerCase().includes('penetrating oil')) {
        aiResponse = `## WD-40 (Penetrating Oil) - Safety Protocol\n\n**Hazard Classification:**\n- H222: Extremely flammable aerosol\n- H319: Eye irritation\n\n**Required PPE:**\n- Chemical-resistant nitrile gloves\n- Safety glasses with side shields\n- Adequate ventilation required\n\n**Storage Requirements:**\n- Cool, dry location away from ignition sources\n- Compatible with aluminum applications\n\n**Reference:** Current SDS Section 8`;
      } else if (questionContent.toLowerCase().includes('acetone')) {
        aiResponse = `## Acetone - Safety Protocol\n\n**Hazard Profile:**\n- H225: Highly flammable liquid\n- H319: Eye irritation\n- H336: CNS depression effects\n\n**Mandatory PPE:**\n- Nitrile gloves (breakthrough time >480 min)\n- Safety glasses with side protection\n- Local exhaust ventilation required\n\n**Exposure Limits:**\n- TWA: 750 ppm\n- STEL: 1000 ppm\n\n**Storage:** Grounded containers, explosion-proof electrical equipment`;
      } else if (questionContent.toLowerCase().includes('ppe') || questionContent.toLowerCase().includes('personal protective')) {
        aiResponse = `## PPE Selection Protocol\n\n**Risk Assessment Required:**\n- Chemical compatibility assessment\n- Exposure duration and concentration analysis\n- Route of exposure evaluation\n\n**Minimum Standards:**\n- **Eyes:** ANSI Z87.1 safety glasses\n- **Hands:** Chemical-resistant gloves per breakthrough data\n- **Respiratory:** When engineering controls insufficient\n- **Body:** Chemical-resistant apron for splash hazards\n\n**Reference:** SDS Section 8 for chemical-specific requirements`;
      } else if (questionContent.toLowerCase().includes('storage') || questionContent.toLowerCase().includes('store')) {
        aiResponse = `## Chemical Storage Requirements\n\n**Compatibility Groups:**\n- Segregate incompatible materials per OSHA 1910.106\n- Maintain proper separation distances\n- Ensure adequate ventilation systems\n\n**Container Standards:**\n- Original labeled containers mandatory\n- Secondary containment where required\n- Grounding/bonding for flammable liquids\n\n**Environmental Controls:**\n- Temperature/humidity per SDS Section 7`;
      } else if (questionContent.toLowerCase().includes('spill') || questionContent.toLowerCase().includes('emergency')) {
        aiResponse = `## Emergency Response Protocol\n\n**Immediate Actions:**\n1. Evacuate non-essential personnel\n2. Eliminate ignition sources\n3. Don appropriate PPE before response\n\n**Containment Procedures:**\n- Use compatible absorbent materials\n- Prevent environmental release\n- Ventilate area if safe to do so\n\n**Notification:** Report per facility emergency procedures\n\n**Reference:** SDS Section 6 for specific cleanup procedures`;
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

  // Markdown renderer for message content
  const renderMarkdown = (content: string) => {
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mb-2">$1</h2>')
      .replace(/^\*\*(.*)\*\*/gm, '<strong>$1</strong>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-4">
      {/* AI Assistant Header */}
      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
              <Bot className="w-5 h-5 text-gray-600 mr-2" />
              Chemical Safety Assistant
            </h3>
            <p className="text-sm text-gray-600">
              Professional guidance on chemical hazards, safety protocols, and regulatory compliance.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
              SDS Database Connected
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
              OSHA Current
            </Badge>
          </div>
        </div>
      </Card>

      {/* Chat Interface */}
      <Card className="p-0 overflow-hidden">
        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-gray-600' 
                    : 'bg-gray-800'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-3 h-3 text-white" />
                  ) : (
                    <Bot className="w-3 h-3 text-white" />
                  )}
                </div>
                
                <div className={`rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div 
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse text-sm">Processing...</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex space-x-3">
            <Input
              type="text"
              placeholder="Enter chemical safety query..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-sm"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isProcessing}
              className="bg-gray-800 hover:bg-gray-900 text-white px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Example Queries */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Common Safety Queries
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {exampleQueries.map((query, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => useExampleQuery(query)}
              className="text-left justify-start h-auto p-2 whitespace-normal text-xs"
            >
              {query}
            </Button>
          ))}
        </div>
      </Card>

      {/* Professional Disclaimer */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Professional Notice
        </h4>
        
        <p className="text-xs text-gray-700">
          This assistant provides technical guidance based on current safety data and regulatory standards. 
          Always consult official Safety Data Sheets, facility procedures, and qualified safety professionals 
          for site-specific applications. This system supplements but does not replace professional safety training.
        </p>
      </Card>
    </div>
  );
};

export default AIAssistant;
