
import { ReactNode } from "react";

interface FeatureAccessWrapperProps {
  children: ReactNode;
  feature: string;
  facilityId: string;
  onUpgrade: () => void;
  fallbackMessage?: string;
  showPreview?: boolean;
}

const FeatureAccessWrapper = ({ 
  children, 
  feature, 
  facilityId, 
  onUpgrade,
  fallbackMessage,
  showPreview = false
}: FeatureAccessWrapperProps) => {
  // During beta testing, always grant access to all features
  return <>{children}</>;
};

export default FeatureAccessWrapper;
