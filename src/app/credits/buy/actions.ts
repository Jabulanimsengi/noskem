// File: app/credits/buy/actions.ts

'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// This action is called by the client AFTER a successful payment for credits.
export async function purchaseCredits(
    packageId: number, 
    paystackRef: string
) {
  const supabase = await createClient();

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to buy credits.' };
  }

  // 2. Fetch the details of the package being purchased to verify the amount
  const { data: creditPackage, error: packageError } = await supabase
    .from('credit_packages')
    .select('credits_amount, bonus_credits')
    .eq('id', packageId)
    .single();

  if (packageError || !creditPackage) {
      return { success: false, error: 'Could not find the selected credit package.' };
  }

  const totalCreditsToAdd = creditPackage.credits_amount + creditPackage.bonus_credits;

  // 3. Use an RPC (Remote Procedure Call) to safely increment the user's balance.
  // This is safer than fetching and then updating, as it prevents race conditions.
  const { error: updateError } = await supabase.rpc('add_credits_to_user', {
      user_id: user.id,
      amount_to_add: totalCreditsToAdd
  });

  if (updateError) {
      console.error('Error updating credit balance:', updateError);
      return { success: false, error: 'Failed to update your credit balance.' };
  }
  
  // 4. Log the transaction for record-keeping.
  await supabase.from('credit_transactions').insert({
      profile_id: user.id,
      amount: totalCreditsToAdd,
      description: `Purchased package ID ${packageId} via Paystack ref: ${paystackRef}`,
  });


  // 5. Revalidate the user's profile data across the app.
  revalidatePath('/account/orders'); // Revalidate pages that might show the balance
  revalidatePath('/credits/buy');

  return { success: true, newBalance: totalCreditsToAdd };
}