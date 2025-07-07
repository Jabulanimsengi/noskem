// src/app/account/dashboard/profile/ProfileClient.tsx
'use client';

import { useEffect, useState } from 'react'; // Import useState
import { useFormState, useFormStatus } from 'react-dom';
import { updateUserProfile, type UpdateProfileState } from './actions';
import Avatar from '../../../components/Avatar';
import { type Profile } from '@/types';
import { useToast } from '@/context/ToastContext';
import MfaManager from './MfaManager';
import { type Factor } from '@supabase/supabase-js';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

interface ProfileClientProps {
  profile: Profile;
  factors: Factor[];
}

export default function ProfileClient({ profile, factors }: ProfileClientProps) {
  const initialState: UpdateProfileState = { message: '', type: null };
  const [state, formAction] = useFormState(updateUserProfile, initialState);
  const { showToast } = useToast();

  // --- ADDED ---
  // State to hold the preview URL for the selected avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);

  useEffect(() => {
    if (state.message) {
      showToast(state.message, state.type || 'info');
      // If the update was successful, update the preview to the new official URL
      if (state.type === 'success' && profile.avatar_url) {
        // This forces a re-render with the latest profile data after revalidation
        setAvatarPreview(profile.avatar_url);
      }
    }
  }, [state, showToast, profile.avatar_url]);

  // --- ADDED ---
  // Handler to update the preview when a new file is selected
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If the file selection is cancelled, revert to the original avatar
      setAvatarPreview(profile.avatar_url);
    }
  };
  
  const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-1";
  const isMfaEnabled = factors.some(f => f.factor_type === 'totp' && f.status === 'verified');

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text-primary mb-6">Edit Profile</h2>
      <form action={formAction} className="space-y-6">
        <div className="flex items-center gap-4">
            {/* --- UPDATED --- Use the avatarPreview state for the src */}
            <Avatar src={avatarPreview} alt={profile.username || 'user'} size={64} />
            <div>
                <label htmlFor="avatar" className={labelStyles}>Update Profile Picture</label>
                {/* --- UPDATED --- Added the onChange handler */}
                <input 
                  type="file" 
                  name="avatar" 
                  id="avatar" 
                  accept="image/*" 
                  className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                  onChange={handleAvatarChange}
                />
            </div>
        </div>

        <div>
          <label htmlFor="username" className={labelStyles}>Public Username</label>
          <input id="username" name="username" type="text" defaultValue={profile.username || ''} required className={inputStyles} />
        </div>

        {profile.account_type === 'individual' ? (
          <>
            <div>
              <label htmlFor="firstName" className={labelStyles}>First Name</label>
              <input id="firstName" name="firstName" type="text" defaultValue={profile.first_name || ''} required className={inputStyles}/>
            </div>
            <div>
              <label htmlFor="lastName" className={labelStyles}>Last Name</label>
              <input id="lastName" name="lastName" type="text" defaultValue={profile.last_name || ''} required className={inputStyles}/>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="companyName" className={labelStyles}>Company Name</label>
            <input id="companyName" name="companyName" type="text" defaultValue={profile.company_name || ''} required className={inputStyles}/>
          </div>
        )}
        
        <div>
            <label htmlFor="availability_notes" className={labelStyles}>Availability</label>
            <textarea
                id="availability_notes"
                name="availability_notes"
                rows={3}
                className={inputStyles}
                defaultValue={profile.availability_notes || ''}
                placeholder="e.g., Available Mon-Fri, 9am - 5pm. Please message before making an offer."
            />
            <p className="text-xs text-gray-500 mt-1">Let buyers know your preferred contact times or availability for questions.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <SubmitButton />
        </div>
      </form>
      
      <MfaManager isMfaEnabled={isMfaEnabled} factors={factors} />
    </div>
  );
}
