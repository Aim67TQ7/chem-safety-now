
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { MessageCircle, Send, Bot, User, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      content: `Hello! I'm your AI chemical safety assistant for ${facilityData.facilityName}. I can help you with questions about chemical safety, PPE requirements, hazard information, and OSHA compliance. What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const { toast } = useToast();

  const exampleQuestions = [
    "Is WD-40 safe to use on aluminum parts?",
    "What PPE do I need when handling acetone?",
    "How should I store flammable chemicals?",
    "What are the first aid steps for chemical splash?",
    "How do I dispose of used cleaning solvents?",
    "What ventilation is required for paint booth operations?"
  ];

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsThinking(true);

    try {
      // Simulate AI response delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock AI responses based on common safety questions
      let aiResponse = "I understand your question about chemical safety. Let me provide you with relevant safety information based on our SDS database and safety protocols.";

      if (currentMessage.toLowerCase().includes('wd-40')) {
        aiResponse = "WD-40 is generally safe for aluminum, but you should:\n\n• Ensure adequate ventilation (H222: Extremely flammable aerosol)\n• Keep away from heat sources and flames\n• Use in well-ventilated areas only\n• Wear nitrile gloves if prolonged contact expected\n• Avoid breathing spray mist\n\nAlways check the specific SDS for your WD-40 product variant.";
      } else if (currentMessage.toLowerCase().includes('acetone')) {
        aiResponse = "For acetone handling, you need:\n\n**PPE Requirements:**\n• Chemical-resistant gloves (nitrile recommended)\n• Safety glasses with side shields\n• Use in well-ventilated area or with local exhaust\n\n**Hazards:**\n• Highly flammable liquid (H225)\n• Causes serious eye irritation (H319)\n• May cause drowsiness (H336)\n\n**Storage:** Keep in cool, dry place away from ignition sources.";
      } else if (currentMessage.toLowerCase().includes('ppe')) {
        aiResponse = "PPE selection depends on the specific chemical and exposure scenario. General guidelines:\n\n• **Eyes:** Safety glasses minimum, goggles for splash risk\n• **Hands:** Chemical-resistant gloves (check compatibility)\n• **Respiratory:** Use when ventilation is inadequate\n• **Body:** Chemical-resistant apron for splash protection\n\nAlways consult the SDS Section 8 for specific PPE recommendations.";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      toast({
        title: "AI Assistant Error",
        description: "Sorry, I'm having trouble right now. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const useExampleQuestion = (question: string) => {
    setCurrentMessage(question);
  };

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Bot className="w-8 h-8 text-blue-600 mr-3" />
              🤖 AI Chemical Safety Assistant
            </h3>
            <p className="text-gray-600">
              Ask me anything about chemical safety, PPE requirements, hazard information, or OSHA compliance.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              ✓ SDS Database Connected
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              ✓ OSHA Guidelines Current
            </Badge>
          </div>
        </div>
      </Card>

      {/* Chat Messages */}
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
                    ? 'bg-blue-600' 
                    : 'bg-gradient-to-br from-red-500 to-blue-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div className={`rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">🤔</div>
                    <span className="text-gray-600">Thinking...</span>
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
              placeholder="Ask about chemical safety, PPE, hazards, or compliance..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isThinking}
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Example Questions */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
          Example Questions
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exampleQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => useExampleQuestion(question)}
              className="text-left justify-start h-auto p-3 whitespace-normal"
            >
              <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {question}
            </Button>
          ))}
        </div>
      </Card>

      {/* AI Disclaimer */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          ⚠️ Important Disclaimer
        </h4>
        
        <p className="text-sm text-gray-700">
          This AI assistant provides general chemical safety guidance based on SDS data and OSHA guidelines. 
          Always consult official Safety Data Sheets, your company's safety procedures, and qualified safety 
          professionals for specific situations. This tool does not replace proper safety training or 
          professional judgment.
        </p>
      </Card>
    </div>
  );
};

export default AIAssistant;
