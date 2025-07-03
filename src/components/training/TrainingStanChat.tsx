import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, ChevronLeft, ChevronRight, GraduationCap, CheckCircle, Play } from 'lucide-react';
import { useTraining } from './OnboardingTrainingProvider';
import AIAssistant from '@/components/AIAssistant';

interface TrainingStanChatProps {
  facilityData: any;
  onClose: () => void;
}

const TrainingStanChat: React.FC<TrainingStanChatProps> = ({
  facilityData,
  onClose
}) => {
  const { 
    currentModule, 
    trainingProgress, 
    completeModule, 
    skipTraining, 
    nextModule, 
    previousModule 
  } = useTraining();

  const [isThinking, setIsThinking] = useState(false);

  if (!currentModule) return null;

  const currentIndex = trainingProgress.findIndex(m => m.id === currentModule.id);
  const totalModules = trainingProgress.length;
  const completedModules = trainingProgress.filter(m => m.completed).length;
  const progressPercentage = Math.round((completedModules / totalModules) * 100);

  // Create training-specific facility data with custom instructions
  const trainingFacilityData = {
    ...facilityData,
    custom_instructions: `You are helping with facility setup and onboarding training for module: ${currentModule.title}. 
    
Current Training Module: ${currentModule.title}
Module Description: ${currentModule.description}

TRAINING MODE RULES:
- Be EXTREMELY helpful and encouraging
- Provide step-by-step guidance for this specific module
- Use real examples relevant to their facility
- Ask interactive questions to ensure understanding
- Guide them through hands-on practice
- Celebrate their progress and completion
- Keep responses focused on the current training module
- Be patient and explain things clearly
- Encourage questions and exploration

Module-Specific Focus:
${getModuleFocus(currentModule.id)}

Remember: This is training mode, so be extra supportive and educational!`
  };

  function getModuleFocus(moduleId: string): string {
    switch (moduleId) {
      case 'introduction':
        return 'Introduce the platform features, explain the dashboard, show them around the interface.';
      case 'sds-search':
        return 'Guide them through searching for Safety Data Sheets, explain how to find chemicals, view documents.';
      case 'label-creation':
        return 'Walk them through creating secondary container labels, explain the process step by step.';
      case 'qr-codes':
        return 'Show how to generate QR codes for facility access, explain the distribution process.';
      case 'incident-reporting':
        return 'Guide through the incident reporting process, explain all the fields and requirements.';
      case 'ai-assistance':
        return 'Demonstrate how to use AI for safety questions, incident investigation, and guidance.';
      default:
        return 'Provide general guidance and support for using the safety platform effectively.';
    }
  }

  const handleModuleComplete = () => {
    completeModule(currentModule.id);
  };

  const handleSkipTraining = () => {
    skipTraining();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col bg-white shadow-2xl">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-3 border-white">
                <AvatarImage 
                  src={isThinking 
                    ? "/lovable-uploads/dc6f065c-1503-43fd-91fc-15ffc9fbf39e.png" 
                    : "/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png"
                  } 
                  alt="Stanley - Training Guide"
                />
                <AvatarFallback className="bg-blue-600 text-white">ST</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <CardTitle className="text-xl">Safety Training with Stanley</CardTitle>
                </div>
                <p className="text-blue-100 text-sm">
                  {isThinking ? "Preparing your training..." : "Your personal safety training guide"}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Section */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{currentModule.title}</h3>
                <p className="text-blue-100 text-sm">{currentModule.description}</p>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {currentIndex + 1} of {totalModules}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Training Progress</span>
                <span>{progressPercentage}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="bg-white/20" />
            </div>
          </div>
        </CardHeader>

        {/* Chat Content */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-full">
            <AIAssistant 
              facilityData={trainingFacilityData}
              onThinkingChange={setIsThinking}
              isTrainingMode={true}
            />
          </div>
        </CardContent>

        {/* Footer Controls */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousModule}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={nextModule}
                disabled={currentIndex === totalModules - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipTraining}
                className="text-gray-600"
              >
                Skip Training
              </Button>
              
              <Button
                onClick={handleModuleComplete}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Module
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrainingStanChat;