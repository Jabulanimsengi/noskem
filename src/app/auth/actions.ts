'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export interface SignInState {
  error?: string | null;
  success?: boolean;
  mfaRequired?: boolean;
  actionId?: string;
}

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
  return { success: true, actionId: randomUUID() };
}

export async function signOutAction() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}