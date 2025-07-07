// src/app/components/UserBadges.tsx
import { FaCheckCircle } from 'react-icons/fa';
import { type Profile } from '@/types';

interface UserBadgesProps {
  // The component now only needs the profile object
  profile: Profile;
}

export default function UserBadges({ profile }: UserBadgesProps) {
  // This is the only check we need.
  const isVerified = profile.verification_status === 'verified';

  // If the user is not verified, we show nothing.
  if (!isVerified) {
    return null;
  }

  // If they are verified, we show the blue checkmark.
  return (
    <div className="flex items-center ml-1" title="Verified Seller">
      <FaCheckCircle className="text-blue-500" />
    </div>
  );
}