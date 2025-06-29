'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { createPaystackCheckout } from '@/lib/paystack';
import { type Profile } from '@/types';

// Define the state for the form action
export interface FormState {
  error?: string | null;
  sessionId?: string | null;
}

export async function createCheckoutSession(prevState: FormState, formData: FormData): Promise<FormState> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to make a purchase.' };
    }

    const itemId = formData.get('itemId');
    const sellerId = formData.get('sellerId');
    const itemPrice = formData.get('itemPrice');

    if (!itemId || !sellerId || !itemPrice) {
        return { error: 'Missing item information.' };
    }
    
    // The cast to Profile is now valid because the type includes the email property
    const { data: sellerProfile } = await supabase.from('profiles').select('email').eq('id', sellerId).single() as { data: Profile | null };

    if (!sellerProfile || !sellerProfile.email) {
        return { error: 'Could not find seller information.' };
    }

    try {
        const checkoutUrl = await createPaystackCheckout({
            email: user.email!,
            amount: parseFloat(itemPrice as string) * 100, // Paystack expects amount in kobo/cents
            metadata: {
                user_id: user.id,
                item_id: itemId,
                seller_id: sellerId,
                cancel_action: `${process.env.NEXT_PUBLIC_BASE_URL}/items/${itemId}`,
            }
        });

        if (checkoutUrl) {
            redirect(checkoutUrl);
        } else {
            return { error: 'Could not create a checkout session.' };
        }
    } catch (e) {
        const err = e as Error;
        return { error: err.message };
    }
}