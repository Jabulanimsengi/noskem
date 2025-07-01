'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// FIX: Ensure this interface is exported
export interface SignInState {
  error?: string | null;
  success?: boolean;
  mfaRequired?: boolean;
  actionId?: string;
}

// FIX: Ensure this function is exported with the correct name
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
    if (error.code === 'mfa_required') {
      return { mfaRequired: true };
    }
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true, actionId: crypto.randomUUID() };
}

export async function signOutAction(): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}