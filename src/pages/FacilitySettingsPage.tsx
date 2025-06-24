
import { useParams } from 'react-router-dom';
import FacilitySettings from '@/components/FacilitySettings';

const FacilitySettingsPage = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();

  if (!facilitySlug) {
    return <div>Invalid facility</div>;
  }

  return <FacilitySettings facilitySlug={facilitySlug} />;
};

export default FacilitySettingsPage;
