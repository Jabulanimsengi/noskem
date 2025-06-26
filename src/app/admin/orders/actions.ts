'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/actions";
import { type OrderStatus } from "@/types";

async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error("Authorization failed: Admins only.");
    return user.id;
}

export async function updateOrderStatusByAdmin(formData: FormData) {
    const adminId = await verifyAdmin();
    const supabase = await createClient();

    const orderId = parseInt(formData.get('orderId') as string);
    const newStatus = formData.get('newStatus') as OrderStatus;
    const notes = formData.get('notes') as string;

    if (!orderId || !newStatus) {
        return { success: false, error: "Missing order ID or new status." };
    }

    // --- FIX STARTS HERE: Separate UPDATE and SELECT ---

    // 1. First, perform the UPDATE operation.
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
    
    if (updateError) {
        return { success: false, error: `Failed to update order: ${updateError.message}`};
    }

    // 2. Log the action to the history table.
    await supabase.from('order_history').insert({
        order_id: orderId,
        status: newStatus,
        notes: notes,
        created_by: adminId,
    });

    // 3. Second, SELECT the details needed for notifications.
    const { data: orderDetails, error: selectError } = await supabase
        .from('orders')
        .select('buyer_id, seller_id, agent_id, items(title)')
        .eq('id', orderId)
        .single();
    
    if(selectError || !orderDetails) {
        // If this fails, the status is already updated, so we just log the error and proceed.
        console.error(`Failed to fetch order details for notification after update: ${selectError?.message}`);
        revalidatePath('/admin/orders');
        return { success: true }; // Return success as the main action completed.
    }
    
    // 4. Send notifications using the fetched details.
    const item = Array.isArray(orderDetails.items) ? orderDetails.items[0] : orderDetails.items;
    const itemTitle = item?.title || 'your item';
    const message = `The status of your order #${orderId} (${itemTitle}) has been updated to: ${newStatus.replace(/_/g, ' ').toUpperCase()}.`;
    
    if (orderDetails.buyer_id) await createNotification(orderDetails.buyer_id, message, `/account/dashboard/orders`);
    if (orderDetails.seller_id) await createNotification(orderDetails.seller_id, message, `/account/dashboard/orders`);
    if (orderDetails.agent_id) await createNotification(orderDetails.agent_id, message, `/agent/dashboard`);

    // --- END OF FIX ---

    revalidatePath('/admin/orders');
    return { success: true };
}