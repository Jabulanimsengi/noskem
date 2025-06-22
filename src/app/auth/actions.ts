'use server';

import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';

// This is the shape of the state object our sign-in action will return
export interface SignInState {
  error?: string | null;
  success?: boolean;
  mfaRequired?: boolean;
}

// Action to handle the initial email/password sign-in
export async function signInAction(prevState: SignInState, formData: FormData): Promise<SignInState> {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Check if the error is specifically because MFA is required
    if (error.code === 'mfa_required') {
      return { mfaRequired: true };
    }
    return { error: error.message };
  }

  // If login is successful and no MFA is required, revalidate and redirect
  redirect('/');
}

// Action to verify the MFA code (moved from mfa_actions.ts)
export async function verifyMfaAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const code = formData.get('code') as string;

  if (!code) {
    return { error: 'Verification code is required.' };
  }

  // We need the factorId, but it's not available in this action.
  // The challengeAndVerify must be done on the client after getting factors.
  // This server-side action is better suited for a custom flow.
  // For now, we will handle this on the client in the AuthModal.
  
  // Let's adjust. The modal will handle this logic.
  // We'll keep this file for the signInAction for now.
  return { error: "Verification should be handled on the client." };
}