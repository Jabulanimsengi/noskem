'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface SignInState {
  error?: string | null;
  success?: boolean;
  mfaRequired?: boolean;
}

/**
 * Handles the initial email/password sign-in attempt.
 * Returns a success or error state to the client-side modal.
 */
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

  // Instead of redirecting, revalidate the cache and return a success message.
  // The client component will handle the UI update.
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Handles signing the user out securely on the server.
 * Redirects to the homepage after sign-out is complete.
 */
export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    // A redirect from a server action is the most reliable way to ensure
    // a clean state on the next page render.
    return redirect('/');
}

// NOTE: The MFA verification logic is handled on the client-side in the
// AuthModal component to provide a better user experience. A server action
// for this is not strictly necessary in the current flow.