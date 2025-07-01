'use server';

import { createClient } from '@/utils/supabase/server';
import { initializeTransaction } from '@/lib/paystack';
import { type Item } from '@/types';

export type FormState = {
    error?: string;
    success?: boolean;
    url?: string;
};

export async function createCheckoutSession(prevState: FormState, formData: FormData): Promise<FormState> {
    console.log("-----------------------------------------");
    console.log("--- 1. SERVER: createCheckoutSession started ---");

    const supabase = await createClient(); // FIX: Added await
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("--- ERROR: User is not authenticated. ---");
        return { error: 'You must be logged in to make a purchase.' };
    }
    console.log(`--- User authenticated: ${user.email} (${user.id}) ---`);

    const itemId = parseInt(formData.get('itemId') as string);
    const amount = parseFloat(formData.get('itemPrice') as string);
    const sellerId = formData.get('sellerId') as string;
    const itemTitle = formData.get('itemTitle') as string;

    console.log(`--- Parsed form data: itemId=${itemId}, amount=${amount}, sellerId=${sellerId}, itemTitle=${itemTitle} ---`);

    if (isNaN(itemId) || isNaN(amount) || !sellerId || !itemTitle) {
        console.error("--- ERROR: Invalid form data received by server action. ---");
        return { error: "Invalid item data provided for checkout." };
    }

    if (user.id === sellerId) {
        console.error("--- ERROR: User is trying to buy their own item. ---");
        return { error: 'You cannot purchase your own item.' };
    }

    console.log("--- 2. Attempting to deduct purchase fee... ---");
    const { data: feeDeducted, error: feeError } = await supabase
        .rpc('deduct_purchase_fee', { p_user_id: user.id });

    if (feeError) {
        console.error("--- FATAL ERROR during deduct_purchase_fee RPC:", feeError, "---");
        return { error: `A server error occurred while processing the purchase fee. Details: ${feeError.message}` };
    }

    if (!feeDeducted) {
        console.error("--- ERROR: Purchase fee deduction failed. User likely has insufficient credits. ---");
        return { error: 'Insufficient credits for the purchase fee. Please top up your account.' };
    }

    console.log("--- 3. Purchase fee successfully deducted. Creating order... ---");

    const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
            item_id: itemId,
            buyer_id: user.id,
            seller_id: sellerId,
            final_amount: amount,
            status: 'pending_payment',
        })
        .select('id')
        .single();

    if (orderError || !newOrder) {
        console.error("--- FATAL ERROR creating order in database:", orderError, "---");
        console.log("--- CRITICAL: A purchase fee was deducted but the order failed. This fee should be refunded. ---");
        return { error: 'Could not create the order after the fee was processed.' };
    }

    console.log(`--- 4. Order #${newOrder.id} created successfully. Initializing Paystack... ---`);

    try {
        const paymentData = await initializeTransaction({
            email: user.email!,
            amount: amount * 100, // Paystack expects amount in kobo
            // FIX: Ensure callback_url is included for redirection
            callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/payment-callback`,
            metadata: {
                order_id: newOrder.id,
                user_id: user.id,
                item_id: itemId,
                item_title: itemTitle,
                description: `Payment for Order #${newOrder.id}`,
            },
        });

        console.log("--- 5. Received response from Paystack. ---");

        if (paymentData.status && paymentData.data.authorization_url) {
            console.log(`--- SUCCESS: Paystack URL received. Redirecting user... ---`);
            return { success: true, url: paymentData.data.authorization_url };
        } else {
            console.error("--- ERROR: Paystack response was not successful:", paymentData, "---");
            console.log("--- CRITICAL: Order created but Paystack failed. Fee should be refunded and order cancelled. ---");
            return { error: paymentData.message || 'Failed to initialize payment.' };
        }
    } catch (error) {
        console.error("--- FATAL ERROR during Paystack initialization:", error, "---");
        console.log("--- CRITICAL: Order created but Paystack failed. Fee should be refunded and order cancelled. ---");
        return { error: 'There was a critical issue contacting the payment provider.' };
    }
}

export async function incrementItemView(itemId: number) {
    const supabase = await createClient(); // FIX: Added await
    const { error } = await supabase.rpc('increment_view_count', {
        item_id_to_increment: itemId
    });

    if (error) {
        console.error('Error incrementing view count:', error);
    }
}