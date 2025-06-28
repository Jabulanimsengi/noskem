'use server';

import { createClient } from '@/app/utils/supabase/server';
import { LISTING_FEE } from '@/lib/constants';

export interface ListItemFormState {
  error: string | null;
  success: boolean;
}

export async function listItemAction(
  prevState: ListItemFormState,
  formData: FormData
): Promise<ListItemFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to list an item.', success: false };
  }

  const title = formData.get('title') as string;
  
  const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_listing_fee', { 
    p_user_id: user.id 
  });

  if (rpcError || !feeDeducted) {
    return { error: 'Could not process listing fee. You may not have enough credits.', success: false };
  }
    
  await supabase.from('financial_transactions').insert({
      user_id: user.id,
      order_id: null,
      type: 'listing_fee',
      status: 'completed',
      amount: -LISTING_FEE,
      description: `Fee for listing item: "${title}"`
  });
  
  // This function would continue to insert the item into the database...
  // For brevity, the rest of the item insertion logic is omitted.

  return { success: true, error: null };
}