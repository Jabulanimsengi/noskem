'use server';

import { createClient } from '../utils/supabase/server';
import { redirect } from 'next/navigation';

export interface SignupFormState {
  error: string | null;
  success: boolean;
}

export async function signupAction(
  prevState: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const supabase = await createClient();

  // Get all data from the form
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const username = formData.get('username') as string;
  const accountType = formData.get('accountType') as 'individual' | 'business';
  
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.', success: false };
  }

  // Check if username is already taken
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (existingProfile) {
    return { error: 'This username is already taken.', success: false };
  }

  // Prepare the metadata object to be passed directly during sign-up
  const metadata: any = {
    username,
    account_type: accountType,
  };

  // Add the correct fields based on account type
  if (accountType === 'individual') {
    metadata.first_name = formData.get('firstName') as string;
    metadata.last_name = formData.get('lastName') as string;
  } else {
    metadata.company_name = formData.get('companyName') as string;
    metadata.company_registration = formData.get('companyRegistration') as string | null;
  }
  
  // Pass the user's chosen data directly in the 'data' field
  // This data will be read by our new database function
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  if (error) {
    return { error: `Sign-up failed: ${error.message}`, success: false };
  }
  
  // On success, redirect to the confirmation page
  redirect('/signup/confirm');
}