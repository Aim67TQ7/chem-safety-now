import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

interface TrainingContextType {
  isTrainingActive: boolean;
  currentModule: TrainingModule | null;
  trainingProgress: TrainingModule[];
  startTraining: () => void;
  completeModule: (moduleId: string) => void;
  skipTraining: () => void;
  nextModule: () => void;
  previousModule: () => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export const useTraining = () => {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};

const DEFAULT_MODULES: TrainingModule[] = [
  {
    id: 'introduction',
    title: 'Welcome to Safety Platform',
    description: 'Learn the basics of navigating your safety management platform',
    completed: false,
    order: 1
  },
  {
    id: 'sds-search',
    title: 'SDS Document Search',
    description: 'Find and access Safety Data Sheets for your chemicals',
    completed: false,
    order: 2
  },
  {
    id: 'label-creation',
    title: 'Secondary Label Creation',
    description: 'Create and print custom safety labels for containers',
    completed: false,
    order: 3
  },
  {
    id: 'qr-codes',
    title: 'QR Code Distribution',
    description: 'Generate and manage QR codes for facility access',
    completed: false,
    order: 4
  },
  {
    id: 'incident-reporting',
    title: 'Incident Reporting',
    description: 'Report and investigate safety incidents and near misses',
    completed: false,
    order: 5
  },
  {
    id: 'ai-assistance',
    title: 'AI Safety Assistant',
    description: 'Use Stanley to get expert safety guidance and analysis',
    completed: false,
    order: 6
  }
];

interface TrainingProviderProps {
  children: React.ReactNode;
  facilityId: string;
}

export const TrainingProvider: React.FC<TrainingProviderProps> = ({
  children,
  facilityId
}) => {
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [currentModule, setCurrentModule] = useState<TrainingModule | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingModule[]>(DEFAULT_MODULES);

  // Load training progress from storage
  useEffect(() => {
    const loadTrainingProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('facility_audit_trail')
          .select('*')
          .eq('facility_id', facilityId)
          .eq('action_type', 'training_progress');

        if (data && data.length > 0) {
          const savedProgress = data[0].new_values as any;
          if (savedProgress?.modules) {
            setTrainingProgress(savedProgress.modules);
          }
        }
      } catch (error) {
        console.error('Error loading training progress:', error);
      }
    };

    if (facilityId) {
      loadTrainingProgress();
    }
  }, [facilityId]);

  const saveTrainingProgress = async (modules: TrainingModule[]) => {
    try {
      await supabase
        .from('facility_audit_trail')
        .upsert({
          facility_id: facilityId,
          action_type: 'training_progress',
          action_description: 'Training progress updated',
          new_values: { modules } as any
        });
    } catch (error) {
      console.error('Error saving training progress:', error);
    }
  };

  const startTraining = () => {
    setIsTrainingActive(true);
    const firstModule = trainingProgress.find(m => !m.completed) || trainingProgress[0];
    setCurrentModule(firstModule);
  };

  const completeModule = async (moduleId: string) => {
    const updatedProgress = trainingProgress.map(module =>
      module.id === moduleId ? { ...module, completed: true } : module
    );
    
    setTrainingProgress(updatedProgress);
    await saveTrainingProgress(updatedProgress);

    // Move to next incomplete module
    const nextIncompleteModule = updatedProgress.find(m => !m.completed);
    if (nextIncompleteModule) {
      setCurrentModule(nextIncompleteModule);
    } else {
      // Training completed
      setIsTrainingActive(false);
      setCurrentModule(null);
    }
  };

  const skipTraining = () => {
    setIsTrainingActive(false);
    setCurrentModule(null);
  };

  const nextModule = () => {
    if (!currentModule) return;
    
    const currentIndex = trainingProgress.findIndex(m => m.id === currentModule.id);
    const nextModule = trainingProgress[currentIndex + 1];
    
    if (nextModule) {
      setCurrentModule(nextModule);
    }
  };

  const previousModule = () => {
    if (!currentModule) return;
    
    const currentIndex = trainingProgress.findIndex(m => m.id === currentModule.id);
    const prevModule = trainingProgress[currentIndex - 1];
    
    if (prevModule) {
      setCurrentModule(prevModule);
    }
  };

  const value: TrainingContextType = {
    isTrainingActive,
    currentModule,
    trainingProgress,
    startTraining,
    completeModule,
    skipTraining,
    nextModule,
    previousModule
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
};