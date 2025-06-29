// src/app/auth/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface SignInState {
  error?: string | null;
  success?: boolean;
  mfaRequired?: boolean;
  actionId?: string;
}

export async function signInAction(prevState: SignInState, formData: FormData): Promise<SignInState> {
  const supabase = createClient();
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

// Corrected signOutAction
export async function signOutAction(): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}