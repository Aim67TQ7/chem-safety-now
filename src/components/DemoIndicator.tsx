import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { useDemoContext } from '@/contexts/DemoContext';

interface DemoIndicatorProps {
  action?: string;
  className?: string;
}

export const DemoIndicator: React.FC<DemoIndicatorProps> = ({ 
  action = "Demo", 
  className = "" 
}) => {
  const { isDemo } = useDemoContext();
  
  if (!isDemo) return null;
  
  return (
    <Badge 
      variant="secondary" 
      className={`bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 ${className}`}
    >
      <Play className="w-3 h-3" />
      {action}
    </Badge>
  );
};

export default DemoIndicator;