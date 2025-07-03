'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function purchaseCredits(
  packageId: number,
  paystackRef: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to buy credits.' };
  }

  const { error } = await supabase.rpc('handle_credit_purchase', {
    p_user_id: user.id,
    p_package_id: packageId,
    p_paystack_ref: paystackRef
  });

  if (error) {
    console.error('Credit purchase database error:', error);
    return { success: false, error: `An error occurred: ${error.message}` };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/account/dashboard');

  return { success: true };
}