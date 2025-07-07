// src/app/forgot-password/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResponse = {
  message: string;
  type: 'success' | 'error' | null;
};

export async function requestPasswordResetAction(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const email = formData.get('email') as string;

  if (!email) {
    return { message: 'Email address is required.', type: 'error' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
  });

  if (error) {
    console.error('Password Reset Error:', error);
    // Provide a generic message to avoid leaking information about which emails are registered.
    return {
      message: "If an account with that email exists, we've sent a password reset link.",
      type: 'success',
    };
  }

  return {
    message: "If an account with that email exists, we've sent a password reset link.",
    type: 'success',
  };
}
