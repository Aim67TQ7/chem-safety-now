import { useContext, createContext } from 'react';

interface FacilityContextType {
  facilityId: string | null;
  facilitySlug: string | null;
}

export const FacilityContext = createContext<FacilityContextType>({
  facilityId: null,
  facilitySlug: null
});

export const useFacilityContext = () => {
  return useContext(FacilityContext);
};