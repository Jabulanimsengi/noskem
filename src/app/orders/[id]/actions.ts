'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/app/actions';

export async function updateOrderStatus(orderId: number, paystackRef: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    const { error: rpcError } = await supabase.rpc('process_order_payment', {
        p_order_id: orderId,
        p_buyer_id: user.id,
        p_paystack_ref: paystackRef
    });

    if (rpcError) {
        console.error(`Error in process_order_payment RPC for order ${orderId}:`, rpcError.message);
        return { success: false, error: `Failed to process order: ${rpcError.message}` };
    }

    try {
        const { data: orderDetails } = await supabase
            .from('orders')
            .select('seller_id, items (title)') // This returns `items` as an array
            .eq('id', orderId)
            .single();

        if (orderDetails && orderDetails.seller_id) {
            // --- FIX IS HERE ---
            // Access the first element of the 'items' array before getting the title.
            const item = Array.isArray(orderDetails.items) ? orderDetails.items[0] : orderDetails.items;
            const itemTitle = item?.title || 'your item';
            // --- END OF FIX ---
            
            const sellerMessage = `Payment has been received for "${itemTitle}" (Order #${orderId}). An agent will be assigned for assessment shortly.`;
            
            await createNotification(orderDetails.seller_id, sellerMessage, '/account/dashboard/orders');
        }

        const { data: agents } = await supabase.from('profiles').select('id').eq('role', 'agent');
        if (agents) {
            const agentMessage = `New Task: Order #${orderId} has been paid and requires assessment.`;
            for (const agent of agents) {
                await createNotification(agent.id, agentMessage, '/agent/dashboard');
            }
        }
    } catch (notificationError: any) {
        console.error("Failed to create notifications:", notificationError.message);
    }

    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/account/dashboard/orders');
    revalidatePath('/agent/dashboard');
    return { success: true };
}