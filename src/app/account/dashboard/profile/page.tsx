// File: app/account/dashboard/profile/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createClient } from '../../../utils/supabase/client';
import { updateUserProfile, type UpdateProfileState } from './actions';

// Define the shape of the profile data
type Profile = {
    username: string | null;
    account_type: string | null;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
};

// A dedicated button component to show the loading state
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Define the initial state for our form action
  const initialState: UpdateProfileState = { message: '', type: null };
  const [state, formAction] = useFormState(updateUserProfile, initialState);

  // Fetch the user's current profile data when the page loads
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, account_type, first_name, last_name, company_name')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }
      setIsLoading(false);
    };
    getProfile();
  }, [supabase]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading your profile...</div>;
  }
  
  if (!profile) {
      return <div className="p-4 text-center text-red-500">Could not load profile data.</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 sm:p-8">
      <h2 className="text-2xl font-semibold text-white mb-6">Edit Profile</h2>
      <form action={formAction} className="space-y-6">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Public Username</label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={profile.username || ''}
            required
            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
          />
        </div>

        {/* Dynamic fields based on account type */}
        {profile.account_type === 'individual' ? (
          <>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
              <input id="firstName" name="firstName" type="text" defaultValue={profile.first_name || ''} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
              <input id="lastName" name="lastName" type="text" defaultValue={profile.last_name || ''} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
            <input id="companyName" name="companyName" type="text" defaultValue={profile.company_name || ''} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"/>
          </div>
        )}
        
        {/* Form message and submit button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <SubmitButton />
            {state?.message && (
                <p className={`text-sm ${state.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {state.message}
                </p>
            )}
        </div>
      </form>
    </div>
  );
}