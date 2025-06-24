'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/actions";

async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error("Authorization failed: Admins only.");
}

export async function approveInspection(orderId: number) {
    await verifyAdmin();
    const supabase = await createClient();

    const { data: order, error } = await supabase
        .from('orders')
        .update({ status: 'awaiting_collection' })
        .eq('id', orderId)
        .select('*, seller:seller_id(id), item:item_id(title), agent:agent_id(id)')
        .single();
    
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found.");

    // Notify the agent to proceed with collection
    if (order.agent) {
        await createNotification(
            order.agent.id,
            `Your inspection report for Order #${orderId} was approved. Please proceed with collection.`,
            '/agent/dashboard'
        );
    }
}

export async function rejectInspection(orderId: number, reason: string) {
    await verifyAdmin();
    const supabase = await createClient();

    // Here you would handle the rejection logic, which could involve
    // cancelling the order, issuing a refund, etc.
    // For now, we will just update the status and notify the parties.
    const { data: order, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select('*, buyer:buyer_id(id), seller:seller_id(id), agent:agent_id(id), item:item_id(title)')
        .single();

    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found.");

    const message = `The inspection for your item "${order.item?.title}" (Order #${orderId}) was rejected by the admin. Reason: ${reason}. The order has been cancelled.`;
    if (order.agent) await createNotification(order.agent.id, message, '/agent/dashboard');
    if (order.buyer) await createNotification(order.buyer.id, message, '/account/dashboard/orders');
    if (order.seller) await createNotification(order.seller.id, message, '/account/dashboard/orders');
}