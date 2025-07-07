// src/app/reset-password/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

type ActionResponse = {
  message: string;
  type: 'success' | 'error' | null;
};

// Zod schema for strong password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.');


export async function updatePasswordAction(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return { message: 'Passwords do not match.', type: 'error' };
  }
  
  const validation = passwordSchema.safeParse(password);
  if (!validation.success) {
    return { message: validation.error.errors[0].message, type: 'error' };
  }

  const supabase = createClient();

  // Supabase automatically handles the user session from the reset token
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error('Password Update Error:', error);
    return { message: 'Failed to update password. Please try again.', type: 'error' };
  }

  return { message: 'Your password has been reset successfully!', type: 'success' };
}
