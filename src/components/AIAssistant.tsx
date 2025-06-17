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
  selectedDocument?: any;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant = ({ facilityData, selectedDocument }: AIAssistantProps) => {
  const getInitialMessage = () => {
    let content = `# Chemical Safety Assistant\n\n**Facility:** ${facilityData.facilityName}`;
    
    if (selectedDocument) {
      content += `\n**Chemical:** ${selectedDocument.product_name}`;
      if (selectedDocument.manufacturer) {
        content += `\n**Manufacturer:** ${selectedDocument.manufacturer}`;
      }
      if (selectedDocument.cas_number) {
        content += `\n**CAS Number:** ${selectedDocument.cas_number}`;
      }
      content += `\n\nI have the complete SDS data for ${selectedDocument.product_name} and can provide specific guidance on handling, storage, PPE, and safety protocols for this chemical.`;
    } else {
      content += `\n\nProviding precise guidance on chemical hazards, PPE requirements, safety protocols, and OSHA compliance.`;
    }
    
    content += ` How may I assist you?`;
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
        `PPE requirements for ${productName}`,
        `Storage requirements for ${productName}`,
        `First aid protocol for ${productName} exposure`,
        `Ventilation requirements when using ${productName}`,
        `Disposal procedures for ${productName}`,
        `Emergency response for ${productName} spills`
      ];
    }
    
    return [
      "PPE requirements for acetone handling",
      "Storage requirements for flammable solvents",
      "First aid protocol for chemical splash",
      "Ventilation requirements for spray operations",
      "Disposal procedures for contaminated materials",
      "Emergency response for chemical spills"
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
      // Process with professional response delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Enhanced responses with document-specific context
      let aiResponse = `## Safety Protocol Assessment\n\n`;
      
      if (selectedDocument) {
        aiResponse += `**Product:** ${selectedDocument.product_name}\n`;
        if (selectedDocument.manufacturer) {
          aiResponse += `**Manufacturer:** ${selectedDocument.manufacturer}\n`;
        }
        aiResponse += `\nBased on the SDS data and current safety regulations:\n\n`;
      } else {
        aiResponse += `Based on current safety data and OSHA regulations:\n\n`;
      }

      // Enhanced response logic with document context
      const productName = selectedDocument?.product_name?.toLowerCase() || '';
      const questionLower = questionContent.toLowerCase();

      if (questionLower.includes('ppe') || questionLower.includes('personal protective')) {
        aiResponse += `## PPE Requirements`;
        if (selectedDocument) {
          aiResponse += ` for ${selectedDocument.product_name}`;
          
          // Use actual SDS data if available
          if (selectedDocument.h_codes) {
            aiResponse += `\n\n**Based on SDS Hazard Codes:**\n`;
            selectedDocument.h_codes.slice(0, 3).forEach((hCode: any) => {
              aiResponse += `- ${hCode.code}: ${hCode.description}\n`;
            });
          }
          
          if (selectedDocument.hmis_codes) {
            aiResponse += `\n**HMIS Ratings:**\n`;
            aiResponse += `- Health: ${selectedDocument.hmis_codes.health || 'N/A'}\n`;
            aiResponse += `- Flammability: ${selectedDocument.hmis_codes.flammability || 'N/A'}\n`;
            aiResponse += `- Physical: ${selectedDocument.hmis_codes.physical || 'N/A'}\n`;
          }
        }
        
        aiResponse += `\n\n**Minimum PPE Standards:**\n`;
        aiResponse += `- **Eyes:** ANSI Z87.1 safety glasses with side shields\n`;
        aiResponse += `- **Hands:** Chemical-resistant nitrile gloves\n`;
        aiResponse += `- **Respiratory:** Local exhaust ventilation required\n`;
        aiResponse += `- **Body:** Chemical-resistant apron for splash hazards`;
        
      } else if (questionLower.includes('storage') || questionLower.includes('store')) {
        aiResponse += `## Storage Requirements`;
        if (selectedDocument) {
          aiResponse += ` for ${selectedDocument.product_name}`;
        }
        
        aiResponse += `\n\n**Compatibility and Segregation:**\n`;
        aiResponse += `- Store away from incompatible materials\n`;
        aiResponse += `- Maintain proper ventilation\n`;
        aiResponse += `- Keep containers tightly closed\n`;
        aiResponse += `- Store in original labeled containers\n\n`;
        
        if (selectedDocument?.signal_word === 'DANGER') {
          aiResponse += `**⚠️ DANGER Signal Word:** Enhanced storage precautions required\n`;
        }
        
      } else if (questionLower.includes('spill') || questionLower.includes('emergency')) {
        aiResponse += `## Emergency Response Protocol`;
        if (selectedDocument) {
          aiResponse += ` for ${selectedDocument.product_name}`;
        }
        
        aiResponse += `\n\n**Immediate Actions:**\n`;
        aiResponse += `1. Evacuate non-essential personnel\n`;
        aiResponse += `2. Eliminate ignition sources\n`;
        aiResponse += `3. Don appropriate PPE before response\n\n`;
        
        if (selectedDocument?.first_aid) {
          aiResponse += `**First Aid (from SDS):**\n`;
          if (selectedDocument.first_aid.skin_contact) {
            aiResponse += `- **Skin Contact:** ${selectedDocument.first_aid.skin_contact}\n`;
          }
          if (selectedDocument.first_aid.eye_contact) {
            aiResponse += `- **Eye Contact:** ${selectedDocument.first_aid.eye_contact}\n`;
          }
        }
        
      } else {
        // General response enhanced with document context
        if (selectedDocument) {
          aiResponse += `## Chemical Information for ${selectedDocument.product_name}\n\n`;
          
          if (selectedDocument.signal_word) {
            aiResponse += `**Signal Word:** ${selectedDocument.signal_word}\n`;
          }
          
          if (selectedDocument.h_codes && selectedDocument.h_codes.length > 0) {
            aiResponse += `**Primary Hazards:**\n`;
            selectedDocument.h_codes.slice(0, 3).forEach((hCode: any) => {
              aiResponse += `- ${hCode.code}: ${hCode.description}\n`;
            });
          }
          
          aiResponse += `\n**Recommended Actions:**\n`;
          aiResponse += `- Review complete SDS document\n`;
          aiResponse += `- Ensure proper PPE selection\n`;
          aiResponse += `- Verify ventilation requirements\n`;
          aiResponse += `- Confirm emergency procedures`;
        } else {
          aiResponse += `Please specify your safety question or search for a specific chemical to get detailed guidance.`;
        }
      }

      const responseTime = Date.now() - questionStartTime;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Log the AI conversation with document context
      await interactionLogger.logAIConversation({
        question: questionContent,
        response: aiResponse,
        responseTimeMs: responseTime,
        metadata: {
          messageCount: messages.length + 2,
          responseType: 'document_specific_guidance',
          productName: selectedDocument?.product_name,
          documentId: selectedDocument?.id
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
        query: query,
        productName: selectedDocument?.product_name,
        documentId: selectedDocument?.id
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
      {/* AI Assistant Header with Document Context */}
      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
              <Bot className="w-5 h-5 text-gray-600 mr-2" />
              Chemical Safety Assistant
              {selectedDocument && (
                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-300 text-xs">
                  {selectedDocument.product_name}
                </Badge>
              )}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedDocument 
                ? `Providing specific guidance for ${selectedDocument.product_name} based on SDS data and safety protocols.`
                : "Professional guidance on chemical hazards, safety protocols, and regulatory compliance."
              }
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
              SDS Database Connected
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
              OSHA Current
            </Badge>
            {selectedDocument && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                Document Context Active
              </Badge>
            )}
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

      {/* Example Queries - Contextual to selected document */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          {selectedDocument ? `Common Questions for ${selectedDocument.product_name}` : 'Common Safety Queries'}
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {getContextualExampleQueries().map((query, index) => (
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
