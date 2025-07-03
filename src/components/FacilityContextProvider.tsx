import React, { createContext, useContext, useEffect, useState } from 'react';
import { interactionLogger } from '@/services/interactionLogger';
import { AuditService } from '@/services/auditService';

interface FacilityContextType {
  facilityId: string | null;
  setFacilityId: (id: string | null) => void;
  logActivity: (eventType: string, eventDetail?: any) => void;
  logAuditEvent: (actionType: string, actionDescription: string, metadata?: any) => void;
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

export const useFacilityContext = () => {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacilityContext must be used within a FacilityContextProvider');
  }
  return context;
};

interface FacilityContextProviderProps {
  children: React.ReactNode;
  facilityId?: string;
}

export const FacilityContextProvider: React.FC<FacilityContextProviderProps> = ({
  children,
  facilityId: initialFacilityId
}) => {
  const [facilityId, setFacilityIdState] = useState<string | null>(initialFacilityId || null);

  const setFacilityId = (id: string | null) => {
    console.log('🏢 FacilityContext: Setting facility ID:', id);
    setFacilityIdState(id);
    interactionLogger.setUserContext(null, id);
  };

  // Set initial facility context
  useEffect(() => {
    if (initialFacilityId) {
      setFacilityId(initialFacilityId);
    }
  }, [initialFacilityId]);

  const logActivity = (eventType: string, eventDetail?: any) => {
    if (!facilityId) {
      console.warn('⚠️ FacilityContext: No facility ID set for activity logging');
      return;
    }

    interactionLogger.logFacilityUsage({
      eventType,
      eventDetail
    });
  };

  const logAuditEvent = (actionType: string, actionDescription: string, metadata?: any) => {
    if (!facilityId) {
      console.warn('⚠️ FacilityContext: No facility ID set for audit logging');
      return;
    }

    AuditService.logAction({
      facilityId,
      actionType,
      actionDescription,
      ...metadata
    });
  };

  const value: FacilityContextType = {
    facilityId,
    setFacilityId,
    logActivity,
    logAuditEvent
  };

  return (
    <FacilityContext.Provider value={value}>
      {children}
    </FacilityContext.Provider>
  );
};

export default FacilityContextProvider;