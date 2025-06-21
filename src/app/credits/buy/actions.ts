'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function purchaseCredits(
    packageId: number, 
    paystackRef: string
) {
  const supabase = await createClient(); // Corrected: Added await

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to buy credits.' };
  }

  const { data: creditPackage, error: packageError } = await supabase
    .from('credit_packages')
    .select('credits_amount, bonus_credits')
    .eq('id', packageId)
    .single();

  if (packageError || !creditPackage) {
      return { success: false, error: 'Could not find the selected credit package.' };
  }

  const totalCreditsToAdd = creditPackage.credits_amount + (creditPackage.bonus_credits || 0);

  const { error: updateError } = await supabase.rpc('add_credits_to_user', {
      user_id: user.id,
      amount_to_add: totalCreditsToAdd
  });

  if (updateError) {
      return { success: false, error: 'Failed to update your credit balance.' };
  }
  
  await supabase.from('credit_transactions').insert({
      profile_id: user.id,
      amount: totalCreditsToAdd,
      description: `Purchased package ID ${packageId} via Paystack ref: ${paystackRef}`,
  });

  revalidatePath('/', 'layout');

  return { success: true };
}