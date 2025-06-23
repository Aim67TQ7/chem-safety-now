
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Minimize2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { interactionLogger } from "@/services/interactionLogger";

interface GlobalSafetyStanWidgetProps {
  initialPosition?: { x: number; y: number };
  companyName?: string;
  customInstructions?: string;
  industry?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function GlobalSafetyStanWidget({
  initialPosition = { x: 50, y: 50 },
  companyName = 'ChemLabel-GPT',
  customInstructions = '',
  industry = 'Chemical Safety'
}: GlobalSafetyStanWidgetProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi there! I'm Stan, your Safety Expert. I'm here to help you with any safety questions about chemicals, PPE, procedures, or workplace safety.\n\nWhat can I help you with today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!avatarRef.current) return;
    
    setIsDragging(true);
    const rect = avatarRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || isLoading) return;

    const questionStartTime = Date.now();

    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    const newMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userMessage, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, newMessage]);

    // Log the user question
    await interactionLogger.logFacilityUsage({
      eventType: 'global_stan_question_asked',
      eventDetail: {
        question: userMessage,
        messageCount: messages.length + 1,
        companyName,
        industry
      }
    });

    try {
      // Prepare conversation history for the AI
      const conversationHistory = messages.slice(1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      console.log('🤖 Calling AI Safety Chat function...');

      const { data, error } = await supabase.functions.invoke('ai-safety-chat', {
        body: {
          message: userMessage,
          conversation_history: conversationHistory,
          sds_document: null,
          facility_data: {
            facility_name: companyName,
            industry: industry,
            custom_instructions: customInstructions
          }
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
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Log the AI conversation
      await interactionLogger.logAIConversation({
        question: userMessage,
        response: data.response,
        responseTimeMs: responseTime,
        metadata: {
          messageCount: messages.length + 2,
          responseType: 'global_stan_chat',
          companyName,
          industry,
          usage: data.usage
        }
      });

    } catch (error) {
      console.error('Global Stan error:', error);
      
      await interactionLogger.logFacilityUsage({
        eventType: 'global_stan_error',
        eventDetail: {
          question: userMessage,
          error: error.message
        }
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
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
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const sendQuickAction = async (action: string) => {
    await sendMessage(`Please help me with: ${action}`);
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  return (
    <>
      {/* Floating Avatar */}
      <div
        ref={avatarRef}
        className="fixed z-40 cursor-move select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.2s ease'
        }}
        onMouseDown={handleMouseDown}
        onClick={() => !isDragging && setIsOpen(true)}
      >
        <div className="relative group">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-600 shadow-lg border-3 border-white flex items-center justify-center hover:shadow-xl transition-all duration-200">
            <Avatar className="w-14 h-14">
              <AvatarImage 
                src={isThinking 
                  ? "/lovable-uploads/dc6f065c-1503-43fd-91fc-15ffc9fbf39e.png" 
                  : "/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png"
                } 
                alt="Safety Stan"
                draggable={false}
              />
              <AvatarFallback className="bg-blue-600 text-white">SS</AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Safety Expert Stan
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Chat Interface */}
      {isOpen && (
        <div
          ref={chatRef}
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200"
          style={{
            left: `${Math.min(position.x, window.innerWidth - 380)}px`,
            top: `${Math.min(position.y + 70, window.innerHeight - 500)}px`,
            width: '360px',
            height: isMinimized ? 'auto' : '480px'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 border-2 border-white">
                  <AvatarImage 
                    src={isThinking 
                      ? "/lovable-uploads/dc6f065c-1503-43fd-91fc-15ffc9fbf39e.png" 
                      : "/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png"
                    } 
                    alt="Safety Stan"
                  />
                  <AvatarFallback className="bg-blue-600 text-white">SS</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">Safety Stan</h3>
                  <p className="text-xs opacity-90">
                    {isThinking ? "Thinking..." : "Safety Expert"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  <Minimize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Actions */}
              <div className="p-3 bg-gray-50 border-b">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => sendQuickAction('OSHA Compliance Check')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    OSHA Check
                  </Button>
                  <Button
                    onClick={() => sendQuickAction('Chemical Safety Review')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Chemical Safety
                  </Button>
                  <Button
                    onClick={() => sendQuickAction('PPE Requirements')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    PPE Guide
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: '300px' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[85%] ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage 
                            src="/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png" 
                            alt="Safety Stan"
                          />
                          <AvatarFallback className="bg-blue-600 text-white">SS</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`rounded-lg p-3 text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: formatMessage(message.content) 
                          }} 
                        />
                        <div className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage 
                          src="/lovable-uploads/dc6f065c-1503-43fd-91fc-15ffc9fbf39e.png" 
                          alt="Safety Stan - Thinking"
                        />
                        <AvatarFallback className="bg-blue-600 text-white">SS</AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-gray-600">Stan is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask Stan about safety..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
