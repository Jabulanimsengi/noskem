'use server';

import { createClient } from "@/app/utils/supabase/server";
import { createAdminClient } from "@/app/utils/supabase/admin";
import { revalidatePath } from 'next/cache';
import { createNotification } from "@/app/actions";

// This helper function now correctly awaits the client.
async function verifyAdmin() {
    // FIX: Added 'await' before createClient()
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Authentication session not found.");
    }
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        throw new Error("Authorization failed: Admins only.");
    }
}

export async function approveInspection(orderId: number) {
    await verifyAdmin();
    // FIX: The createAdminClient call does not need await as it is synchronous.
    // The previous fix to use the admin client here was correct.
    const supabase = createAdminClient();

    const { data: order, error } = await supabase
        .from('orders')
        .update({ status: 'awaiting_collection' })
        .eq('id', orderId)
        .select('agent_id')
        .single();
    
    if (error || !order) {
        throw new Error(`Could not approve inspection: ${error?.message}`);
    }

    if (order.agent_id) {
        await createNotification(
            order.agent_id,
            `Your inspection report for Order #${orderId} was approved. Please proceed with collection.`,
            `/agent/dashboard/task/${orderId}`
        );
    }
    
    revalidatePath('/admin/inspections');
    revalidatePath('/agent/dashboard');
}

export async function rejectInspection(orderId: number, reason: string) {
    await verifyAdmin();
    // FIX: The createAdminClient call does not need await.
    const supabase = createAdminClient();

    const { data: order, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select('*, item:items(title)')
        .single();

    if (error || !order) {
        throw new Error(`Could not reject inspection: ${error?.message}`);
    }

    const itemTitle = order.item?.title || 'an item';
    const message = `The inspection for "${itemTitle}" (Order #${orderId}) was rejected. Reason: ${reason}. The order has been cancelled.`;

    if (order.agent_id) {
        await createNotification(
            order.agent_id, 
            message, 
            `/agent/dashboard/task/${orderId}`
        );
    }

    if (order.buyer_id) await createNotification(order.buyer_id, message, '/account/dashboard/orders');
    if (order.seller_id) await createNotification(order.seller_id, message, '/account/dashboard/orders');

    revalidatePath('/admin/inspections');
    revalidatePath('/agent/dashboard');
}