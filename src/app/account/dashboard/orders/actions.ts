'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const getAuthenticatedUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('You must be logged in.');
    }
    return user;
};

export async function requestReturnAction(orderId: number) {
    const user = await getAuthenticatedUser();
    const supabase = createClient();

    // Check if the user is the buyer of this order
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, buyer_id, status')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        throw new Error('Order not found.');
    }
    if (order.buyer_id !== user.id) {
        throw new Error('You are not authorized to perform this action.');
    }
    if (order.status !== 'delivered') {
        throw new Error('A dispute can only be filed for delivered items.');
    }

    // Update the order status to 'disputed'
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'disputed' })
        .eq('id', orderId);

    if (updateError) {
        throw new Error(`Failed to file dispute: ${updateError.message}`);
    }
    
    revalidatePath(`/account/dashboard/orders`);
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
}

export async function cancelOrderAction(orderId: number) {
     const user = await getAuthenticatedUser();
    const supabase = createClient();

    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, buyer_id, seller_id, status, item_id')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        return { error: 'Order not found.' };
    }
    if (order.buyer_id !== user.id) {
        return { error: 'You are not authorized to cancel this order.' };
    }
    if (!['pending_payment', 'payment_authorized'].includes(order.status)) {
         return { error: 'This order can no longer be cancelled.' };
    }

    // Start a transaction to ensure both updates succeed or fail together
    const { error } = await supabase.rpc('cancel_order_and_restock_item', {
        p_order_id: orderId,
        p_item_id: order.item_id
    });

    if (error) {
        return { error: `Failed to cancel order: ${error.message}` };
    }

    revalidatePath('/account/dashboard/orders');
    revalidatePath(`/items/${order.item_id}`);
    return { success: true };
}