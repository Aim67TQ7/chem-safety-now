import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, Play, CheckCircle, Clock, Users } from 'lucide-react';
import { useTraining } from './OnboardingTrainingProvider';

interface TrainingWelcomeCardProps {
  onStartTraining: () => void;
}

const TrainingWelcomeCard: React.FC<TrainingWelcomeCardProps> = ({
  onStartTraining
}) => {
  const { trainingProgress } = useTraining();
  
  const completedModules = trainingProgress.filter(m => m.completed).length;
  const totalModules = trainingProgress.length;
  const isCompleted = completedModules === totalModules;

  if (isCompleted) return null;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 border-2 border-blue-200">
              <AvatarImage 
                src="/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png" 
                alt="Stanley - Training Guide"
              />
              <AvatarFallback className="bg-blue-600 text-white">ST</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <GraduationCap className="w-5 h-5" />
                Welcome to Your Safety Platform!
              </CardTitle>
              <p className="text-blue-700 text-sm">
                Let Stanley guide you through interactive training
              </p>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {completedModules}/{totalModules} Complete
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700">~15 minutes total</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Interactive guidance</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="w-4 h-4 text-purple-600" />
            <span className="text-gray-700">Hands-on practice</span>
          </div>
        </div>

        <div className="bg-white/70 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">You'll learn how to:</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Search and access Safety Data Sheets</li>
            <li>• Create and print secondary container labels</li>
            <li>• Generate QR codes for facility access</li>
            <li>• Report and investigate safety incidents</li>
            <li>• Use AI assistance for safety guidance</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-600">
            Stanley will guide you step-by-step through each feature
          </p>
          
          <Button 
            onClick={onStartTraining}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Training
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingWelcomeCard;