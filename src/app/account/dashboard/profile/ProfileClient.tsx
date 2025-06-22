'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateUserProfile, type UpdateProfileState } from './actions';
import Avatar from '../../../components/Avatar';
import { type Profile } from '@/types';
import { useToast } from '@/context/ToastContext';
import MfaManager from './MfaManager';

// This is the submit button for the form
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
  factors: any[];
}

// This component now holds all the client-side logic and state.
export default function ProfileClient({ profile, factors }: ProfileClientProps) {
  const initialState: UpdateProfileState = { message: '', type: null };
  const [state, formAction] = useActionState(updateUserProfile, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.message) {
      showToast(state.message, state.type || 'info');
    }
  }, [state, showToast]);
  
  const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
  const isMfaEnabled = factors.some(f => f.factor_type === 'totp' && f.status === 'verified');

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text-primary mb-6">Edit Profile</h2>
      <form action={formAction} className="space-y-6">
        <div className="flex items-center gap-4">
            <Avatar src={profile.avatar_url} alt={profile.username || 'user'} size={64} />
            <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-text-secondary mb-1">Update Profile Picture</label>
                <input type="file" name="avatar" id="avatar" accept="image/*" className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"/>
            </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">Public Username</label>
          <input id="username" name="username" type="text" defaultValue={profile.username || ''} required className={inputStyles} />
        </div>

        {profile.account_type === 'individual' ? (
          <>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary mb-1">First Name</label>
              <input id="firstName" name="firstName" type="text" defaultValue={profile.first_name || ''} required className={inputStyles}/>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-text-secondary mb-1">Last Name</label>
              <input id="lastName" name="lastName" type="text" defaultValue={profile.last_name || ''} required className={inputStyles}/>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-text-secondary mb-1">Company Name</label>
            <input id="companyName" name="companyName" type="text" defaultValue={profile.company_name || ''} required className={inputStyles}/>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <SubmitButton />
        </div>
      </form>
      
      {/* The MfaManager component is also part of this client component */}
      <MfaManager isMfaEnabled={isMfaEnabled} factors={factors} />
    </div>
  );
}