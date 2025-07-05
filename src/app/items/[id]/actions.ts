// src/app/items/[id]/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { initializeTransaction } from '@/lib/paystack';

// Export the FormState type so it can be imported by other components.
export type FormState = {
    error?: string;
    success?: boolean;
    url?: string;
};

// The signature is updated to accept prevState, matching useFormState's requirements.
export async function createCheckoutSession(prevState: FormState, formData: FormData): Promise<FormState> {
    console.log("--- 1. SERVER: createCheckoutSession started ---");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to make a purchase.' };
    }

    const itemId = parseInt(formData.get('itemId') as string);
    const itemPrice = parseFloat(formData.get('itemPrice') as string);
    // Note: 'addDelivery' is not needed here as it's handled in the BuyNowForm and passed to the action
    // But if you needed it for other logic, you could get it like this:
    // const addDelivery = formData.get('addDelivery') === 'true';

    if (isNaN(itemId) || isNaN(itemPrice)) {
        return { error: "Invalid item data provided." };
    }

    // The logic to handle delivery fee and total amount should be here,
    // assuming it's not already handled before calling this action.
    // Based on previous changes, let's assume the correct total is passed or calculated.
    const addDelivery = formData.get('addDelivery') === 'true';
    const deliveryFee = 399;
    const totalAmount = addDelivery ? itemPrice + deliveryFee : itemPrice;


    console.log(`--- 2. Calling atomic database function 'handle_item_purchase' for item #${itemId}... ---`);
    const { data: newOrderId, error: purchaseError } = await supabase.rpc('handle_item_purchase', {
        p_buyer_id: user.id,
        p_item_id: itemId,
    });

    if (purchaseError) {
        console.error("--- FATAL ERROR during handle_item_purchase RPC:", purchaseError, "---");
        return { error: `Could not complete purchase: ${purchaseError.message}` };
    }

    if (!newOrderId) {
        return { error: 'Failed to create an order, please try again.' };
    }

    console.log(`--- 3. Order #${newOrderId} created. ---`);

    if (addDelivery) {
        console.log(`--- 3a. Delivery option selected. Updating order #${newOrderId} with total R${totalAmount}... ---`);
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                final_amount: totalAmount,
                delivery_fee_paid: deliveryFee
            })
            .eq('id', newOrderId);

        if (updateError) {
            console.error("--- FATAL ERROR updating order with delivery fee:", updateError, "---");
            return { error: `Could not add delivery fee to the order: ${updateError.message}` };
        }
    }


    console.log(`--- 4. Initializing Paystack for a total of R${totalAmount}... ---`);

    try {
        const paymentData = await initializeTransaction({
            email: user.email!,
            amount: totalAmount * 100,
            callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/payment-callback`,
            metadata: { 
                order_id: newOrderId, 
                user_id: user.id, 
                item_id: itemId,
                add_delivery: addDelivery 
            },
        });

        if (paymentData.status && paymentData.data.authorization_url) {
            console.log(`--- SUCCESS: Paystack URL created. Returning to client... ---`);
            return { success: true, url: paymentData.data.authorization_url };
        } else {
            return { error: paymentData.message || 'Failed to initialize payment.' };
        }
    } catch (error) {
        console.error("--- FATAL ERROR during Paystack initialization:", error, "---");
        return { error: 'There was a critical issue contacting the payment provider.' };
    }
}

// This function remains the same.
export async function incrementItemView(itemId: number) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('increment_view_count', {
        item_id_to_increment: itemId
    });

    if (error) {
        console.error('Error incrementing view count:', error);
    }
}
