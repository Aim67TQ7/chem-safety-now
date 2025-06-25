import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Minimize2, Maximize2, ExternalLink, FileText } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { interactionLogger } from "@/services/interactionLogger";
import { useNavigate, useLocation } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface GlobalSafetyStanWidgetProps {
  initialPosition?: { x: number; y: number };
  companyName?: string;
  customInstructions?: string;
  industry?: string;
  selectedDocument?: any;
  onFormDataUpdate?: (field: string, value: string) => void;
  formData?: {
    facilityName?: string;
    contactName?: string;
    address?: string;
    email?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function GlobalSafetyStanWidget({
  initialPosition = { x: 400, y: 50 },
  companyName = 'ChemLabel-GPT',
  customInstructions = '',
  industry = 'Chemical Safety',
  selectedDocument,
  onFormDataUpdate,
  formData
}: GlobalSafetyStanWidgetProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 360, height: 520 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [hasAskedSetupQuestion, setHasAskedSetupQuestion] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on different pages
  const isHomepage = location.pathname === '/';
  const isSignupPage = location.pathname === '/signup';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update initial message based on page and document context
  useEffect(() => {
    if (selectedDocument) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi! I'm Stan, your Safety Expert. I see you want to know about **${selectedDocument.product_name}**${selectedDocument.manufacturer ? ` from ${selectedDocument.manufacturer}` : ''}.\n\nI have all the safety data for this chemical. What would you like to know? I can help with:\n\n• Hazard information\n• First aid procedures\n• PPE requirements\n• Storage requirements\n• Emergency procedures`,
        timestamp: new Date()
      }]);
      setIsOpen(true); // Auto-open when document is provided
    } else if (isHomepage) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi! I'm Stan, your Safety Expert. Ready to see how ChemLabel-GPT can save your facility hours of paperwork?\n\nJust give me your email and I'll show you around!`,
        timestamp: new Date()
      }]);
    } else if (isSignupPage) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi! I'm Stan. I can help you fill out this form quickly.\n\n**A)** Let me guide you step-by-step\n**B)** I'll fill it out myself\n\nWhich would you prefer?`,
        timestamp: new Date()
      }]);
    } else {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi there! I'm Stan, your Safety Expert. I'm here to help you with any safety questions about chemicals, PPE, procedures, or workplace safety.\n\nWhat can I help you with today?`,
        timestamp: new Date()
      }]);
    }
  }, [isHomepage, isSignupPage, selectedDocument]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!avatarRef.current) return;
    
    setIsDragging(true);
    const rect = avatarRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle resize functionality
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: chatSize.width,
      height: chatSize.height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isResizing) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep Stanley within screen bounds
        const maxX = window.innerWidth - 240; // Stanley width
        const maxY = window.innerHeight - 346; // Stanley height (20% taller: 288 * 1.2 = 346)
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(300, Math.min(800, resizeStart.width + deltaX));
        const newHeight = Math.max(400, Math.min(700, resizeStart.height + deltaY));
        
        setChatSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  const handleEmailSubmit = () => {
    if (emailInput.trim() && emailInput.includes('@')) {
      navigate(`/signup?email=${encodeURIComponent(emailInput.trim())}`);
    } else {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
    }
  };

  const extractFormDataFromResponse = (response: string) => {
    if (!onFormDataUpdate) return [];

    const message = response.toLowerCase();
    let extractedData: string[] = [];
    
    // More flexible patterns for facility/company name
    // Check if user is directly providing a facility name
    if (message.includes('facility') || message.includes('company')) {
      // Look for patterns like "my facility is X" or "company name is X"
      const facilityPatterns = [
        /(?:facility|company)(?:\s+name)?\s+is\s+([^.\n,]+)/i,
        /(?:my|our)\s+(?:facility|company)(?:\s+name)?\s+is\s+([^.\n,]+)/i,
        /(?:facility|company):\s*([^.\n,]+)/i,
        /(?:called|named)\s+([^.\n,]+)/i
      ];
      
      for (const pattern of facilityPatterns) {
        const match = response.match(pattern);
        if (match && match[1]) {
          const facilityName = match[1].trim().replace(/["""]/g, '');
          if (facilityName.length > 2) {
            onFormDataUpdate('facilityName', facilityName);
            extractedData.push(`facility name: ${facilityName}`);
            break;
          }
        }
      }
    } else {
      // If no explicit facility keyword, check if they're just stating a company name
      // Look for proper nouns or company-like names
      const words = response.trim().split(/\s+/);
      if (words.length <= 5 && words.length >= 1) {
        // Check if it looks like a company name (contains capital letters, common business words)
        const businessKeywords = ['inc', 'llc', 'corp', 'company', 'industries', 'manufacturing', 'group', 'solutions', 'systems', 'technologies'];
        const hasBusinessKeyword = businessKeywords.some(keyword => 
          message.includes(keyword)
        );
        
        // Or if it's a short phrase that looks like a name
        if (hasBusinessKeyword || (words.length <= 3 && response.length > 3 && response.length < 50)) {
          const potentialName = response.trim().replace(/["""]/g, '');
          if (potentialName.length > 2 && !potentialName.includes('?') && !potentialName.includes('help')) {
            onFormDataUpdate('facilityName', potentialName);
            extractedData.push(`facility name: ${potentialName}`);
          }
        }
      }
    }

    // Extract contact name
    const contactPatterns = [
      /(?:my\s+name\s+is|i'm|i\s+am)\s+([^.\n,]+)/i,
      /(?:contact|name):\s*([^.\n,]+)/i,
      /(?:call\s+me)\s+([^.\n,]+)/i
    ];
    
    for (const pattern of contactPatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        const contactName = match[1].trim().replace(/["""]/g, '');
        if (contactName.length > 2 && !contactName.includes('facility') && !contactName.includes('company')) {
          onFormDataUpdate('contactName', contactName);
          extractedData.push(`contact name: ${contactName}`);
          break;
        }
      }
    }

    // Extract address
    const addressPatterns = [
      /(?:address|located|at)\s+(?:is\s+)?([^.\n]+(?:street|st|avenue|ave|road|rd|drive|dr|blvd|boulevard|lane|ln|way|court|ct|circle|cir)[^.\n]*)/i,
      /(?:address|located|at):\s*([^.\n]+)/i,
      /\d+\s+[^.\n,]+(street|st|avenue|ave|road|rd|drive|dr|blvd|boulevard|lane|ln|way|court|ct|circle|cir)[^.\n]*/i
    ];
    
    for (const pattern of addressPatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        const address = match[1].trim().replace(/["""]/g, '');
        if (address.length > 5) {
          onFormDataUpdate('address', address);
          extractedData.push(`address: ${address}`);
          break;
        }
      }
    }

    return extractedData;
  };

  const getNextMissingField = () => {
    if (!formData?.facilityName) return 'facilityName';
    if (!formData?.contactName) return 'contactName';
    if (!formData?.address) return 'address';
    return null;
  };

  const getNextQuestion = () => {
    const missing = getNextMissingField();
    switch (missing) {
      case 'facilityName':
        return 'What\'s your facility name?';
      case 'contactName':
        return 'What\'s your full name?';
      case 'address':
        return 'What\'s your facility address?';
      default:
        return 'Perfect! All set. **A)** Submit now **B)** Review details first?';
    }
  };

  const isFormComplete = () => {
    return formData?.facilityName && formData?.contactName && formData?.address && formData?.email;
  };

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

    try {
      // For signup page, handle form assistance
      if (isSignupPage) {
        // Extract any form data from user message FIRST
        const extractedData = extractFormDataFromResponse(userMessage) || [];
        
        // Check if user is asking questions not related to signup
        const signupRelatedKeywords = ['facility', 'company', 'name', 'address', 'contact', 'setup', 'form', 'a)', 'b)', 'guide', 'step'];
        const isSignupRelated = signupRelatedKeywords.some(keyword => 
          userMessage.toLowerCase().includes(keyword)
        );

        // If asking about other topics and form isn't complete, redirect to signup completion
        if (!isSignupRelated && !isFormComplete() && extractedData.length === 0) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I'd be happy to help with that! Let's finish your setup first. ${getNextQuestion()}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
          setIsThinking(false);
          return;
        }

        // If we extracted data, acknowledge it and ask next question
        if (extractedData.length > 0) {
          const nextQuestion = getNextQuestion();
          const acknowledgment = `Got it! ✓ ${extractedData.join(' and ')}\n\n${nextQuestion}`;
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: acknowledgment,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
          setIsThinking(false);
          return;
        } else {
          // Build context about current form state
          let formContext = '';
          if (formData) {
            formContext = `Current form data:
- Facility Name: ${formData.facilityName || 'Not filled'}
- Contact Name: ${formData.contactName || 'Not filled'}
- Address: ${formData.address || 'Not filled'}
- Email: ${formData.email || 'Not filled'}`;
          }

          const conversationHistory = messages.slice(1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));

          const { data, error } = await supabase.functions.invoke('ai-safety-chat', {
            body: {
              message: userMessage,
              conversation_history: conversationHistory,
              sds_document: selectedDocument,
              facility_data: {
                facility_name: companyName,
                industry: industry,
                custom_instructions: selectedDocument 
                  ? `${customInstructions}\n\nYou are currently helping with questions about ${selectedDocument.product_name}. Use the SDS data provided to give specific, accurate safety guidance.`
                  : customInstructions
              }
            }
          });

          if (error) throw new Error(error.message || 'Failed to get AI response');

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // Regular chat functionality for other pages
        const conversationHistory = messages.slice(1).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        const { data, error } = await supabase.functions.invoke('ai-safety-chat', {
          body: {
            message: userMessage,
            conversation_history: conversationHistory,
            sds_document: selectedDocument,
            facility_data: {
              facility_name: companyName,
              industry: industry,
              custom_instructions: customInstructions
            }
          }
        });

        if (error) throw new Error(error.message || 'Failed to get AI response');

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

      // Log the interaction
      await interactionLogger.logFacilityUsage({
        eventType: 'global_stan_question_asked',
        eventDetail: {
          question: userMessage,
          messageCount: messages.length + 1,
          companyName,
          industry,
          page: location.pathname
        }
      });

    } catch (error) {
      console.error('Global Stan error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
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
    if (isSignupPage) {
      if (action === 'start_setup') {
        await sendMessage("A) Guide me step-by-step");
      } else if (action === 'manual_form') {
        setIsOpen(false);
        toast({
          title: "Form Ready",
          description: "You can now fill out the form manually. I'll be here if you need help!",
        });
      }
    } else {
      await sendMessage(`Please help me with: ${action}`);
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  // Calculate chat position to stay beside Stanley
  const getChatPosition = () => {
    const stanleyWidth = 240;
    
    // Always position chat to the right of Stanley first
    let chatX = position.x + stanleyWidth + 20;
    let chatY = position.y;

    // If chat would go off the right edge, position it to the left of Stanley
    if (chatX + chatSize.width > window.innerWidth) {
      chatX = position.x - chatSize.width - 20;
    }

    // If still off-screen, position above or below Stanley
    if (chatX < 0) {
      chatX = position.x;
      chatY = position.y - chatSize.height - 20;
      
      // If above goes off-screen, position below
      if (chatY < 0) {
        chatY = position.y + 346 + 20; // Stanley height (20% taller) + margin
      }
    }

    // Final bounds check
    chatX = Math.max(20, Math.min(chatX, window.innerWidth - chatSize.width - 20));
    chatY = Math.max(20, Math.min(chatY, window.innerHeight - chatSize.height - 20));

    return { x: chatX, y: chatY };
  };

  const chatPosition = getChatPosition();

  const handleViewPDF = () => {
    if (selectedDocument?.bucket_url) {
      window.open(selectedDocument.bucket_url, '_blank');
    } else if (selectedDocument?.source_url) {
      window.open(selectedDocument.source_url, '_blank');
    }
  };

  return (
    <>
      {/* Floating Stanley Avatar - 20% taller - In front of entire site */}
      <div
        ref={avatarRef}
        data-stanley-avatar
        className="fixed z-[9999] cursor-move select-none"
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
          {/* Stanley's full body - 20% taller (288 * 1.2 = 346) */}
          <div className="w-60 h-[346px] flex items-center justify-center hover:drop-shadow-xl transition-all duration-200">
            <img
              src={isThinking 
                ? "/lovable-uploads/dc6f065c-1503-43fd-91fc-15ffc9fbf39e.png" 
                : "/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png"
              }
              alt="Safety Stan"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            {selectedDocument ? `Ask about ${selectedDocument.product_name}` : 'Safety Expert Stan'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Chat Interface - Above Stanley but transparent with resizable functionality */}
      {isOpen && (
        <div
          ref={chatRef}
          className="fixed z-[10000] bg-white/80 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 resize-none"
          style={{
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            width: `${chatSize.width}px`,
            height: isMinimized ? 'auto' : `${chatSize.height}px`
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/90 to-green-600/90 text-white p-4 rounded-t-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 border-2 border-white rounded-lg overflow-hidden bg-white">
                  <img
                    src={isThinking 
                      ? "/lovable-uploads/dc6f065c-1503-43fd-91fc-15ffc9fbf39e.png" 
                      : "/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png"
                    }
                    alt="Safety Stan"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Safety Stan</h3>
                  <p className="text-xs opacity-90">
                    {isThinking ? "Thinking..." : selectedDocument ? `Expert on ${selectedDocument.product_name}` : isSignupPage ? "Setup Assistant" : "Safety Expert"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedDocument && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleViewPDF}
                    className="text-white hover:bg-white/20 h-6 px-2 text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    View PDF
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
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

            {/* Document Context Banner */}
            {selectedDocument && !isMinimized && (
              <div className="mt-3 p-2 bg-white/20 rounded text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{selectedDocument.product_name}</div>
                    {selectedDocument.manufacturer && (
                      <div className="opacity-80">{selectedDocument.manufacturer}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* Quick Actions - Show document-specific actions when document is selected */}
              {selectedDocument ? (
                <div className="p-3 bg-gray-50/80 border-b backdrop-blur-sm">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => sendMessage('What are the main hazards of this chemical?')}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="text-xs text-gray-800 border-gray-300 hover:bg-gray-100/80"
                    >
                      Main Hazards
                    </Button>
                    <Button
                      onClick={() => sendMessage('What PPE is required for this chemical?')}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="text-xs text-gray-800 border-gray-300 hover:bg-gray-100/80"
                    >
                      PPE Required
                    </Button>
                    <Button
                      onClick={() => sendMessage('What first aid is needed for exposure?')}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="text-xs text-gray-800 border-gray-300 hover:bg-gray-100/80"
                    >
                      First Aid
                    </Button>
                  </div>
                </div>
              ) : isSignupPage ? (
                // ... keep existing code (signup quick actions)
              ) : !isHomepage && (
                // ... keep existing code (general quick actions)
              )}

              {/* Messages */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3" 
                style={{ 
                  height: isHomepage ? `${chatSize.height - 200}px` : isSignupPage ? `${chatSize.height - 260}px` : selectedDocument ? `${chatSize.height - 320}px` : `${chatSize.height - 260}px`,
                  maxHeight: `${chatSize.height - 160}px`
                }}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[85%] ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 border border-gray-200 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          <img
                            src="/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png"
                            alt="Safety Stan"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      
                      <div className={`rounded-lg p-3 text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600/90 text-white'
                          : 'bg-gray-100/90 text-gray-900'
                      }`}>
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: formatMessage(message.content) 
                          }} 
                        />
                        <div className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-600'
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
                      <div className="w-8 h-8 border border-gray-200 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        <img
                          src="/lovable-uploads/dc6f065c-1503-43fd-91fc-15ffc9fbf39e.png"
                          alt="Safety Stan - Thinking"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="bg-gray-100/90 rounded-lg p-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-gray-700">Stan is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input - Different for homepage */}
              <div className="p-3 border-t bg-white/80 backdrop-blur-sm">
                {isHomepage ? (
                  <div className="space-y-3">
                    <div className="text-center text-sm text-gray-800 mb-2">
                      Enter your email to get started:
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                        placeholder="your.email@company.com"
                        className="flex-1 text-sm text-gray-900 bg-white/90"
                      />
                      <Button
                        onClick={handleEmailSubmit}
                        disabled={!emailInput.trim() || !emailInput.includes('@')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Go!
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={isSignupPage ? "Tell me about your facility..." : "Ask Stan about safety..."}
                      disabled={isLoading}
                      className="flex-1 text-sm text-gray-900 bg-white/90"
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Send
                    </Button>
                  </div>
                )}
              </div>

              {/* WebAtars Promotion */}
              <div className="px-3 pb-3">
                <div className="bg-gradient-to-r from-purple-100/80 to-blue-100/80 rounded-lg p-2 text-center border border-purple-200/50">
                  <p className="text-xs text-gray-800">
                    Powered by{' '}
                    <a 
                      href="https://n0v8v.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold text-purple-700 hover:text-purple-900 underline"
                    >
                      WebAtars by n0v8v.com
                    </a>
                  </p>
                </div>
              </div>

              {/* Resize Handle */}
              <div
                ref={resizeHandleRef}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-400/50 hover:bg-gray-600/70 transition-colors"
                onMouseDown={handleResizeMouseDown}
                style={{
                  background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, currentColor 30%, currentColor 40%, transparent 40%, transparent 60%, currentColor 60%, currentColor 70%, transparent 70%)'
                }}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
