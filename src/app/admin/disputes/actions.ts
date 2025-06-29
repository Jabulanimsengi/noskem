'use server';

import { createAdminClient } from "@/app/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/actions";

// Define a state interface for our form action
export interface ResolutionFormState {
    error?: string | null;
    success?: boolean;
}

async function verifyAdmin() {
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error("Authorization failed: Admins only.");
    return user.id;
}

// The action now accepts 'prevState' as the first argument to match useFormState's signature
export async function resolveDisputeAction(
    prevState: ResolutionFormState, 
    formData: FormData
): Promise<ResolutionFormState> {
    try {
        const adminId = await verifyAdmin();
        const supabase = createAdminClient();

        const orderId = parseInt(formData.get('orderId') as string);
        const resolution = formData.get('resolution') as 'refund_buyer' | 'pay_seller';
        const adminNotes = formData.get('adminNotes') as string;

        if (!orderId || !resolution || !adminNotes) {
            return { error: "Order ID, resolution type, and admin notes are required." };
        }
        
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*, items(title)')
            .eq('id', orderId)
            .single();
            
        if (fetchError || !order) {
            return { error: "Disputed order not found." };
        }

        const finalStatus = resolution === 'refund_buyer' ? 'cancelled' : 'completed';
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: finalStatus })
            .eq('id', orderId);

        if (updateError) {
            return { error: `Failed to update order status: ${updateError.message}` };
        }
        
        await supabase.from('dispute_messages').insert({
            order_id: orderId,
            profile_id: adminId,
            message: `ADMIN RESOLUTION: The dispute has been resolved. Decision: ${resolution.replace(/_/g, ' ').toUpperCase()}. Notes: ${adminNotes}`
        });

        const itemTitle = order.items?.title || 'the item';
        const message = `A decision has been made on the dispute for order #${orderId} (${itemTitle}). Please check the order details page.`;
        await createNotification(order.buyer_id, message, `/orders/${order.id}`);
        await createNotification(order.seller_id, message, `/orders/${order.id}`);

        revalidatePath('/admin/disputes');
        revalidatePath(`/admin/disputes/${orderId}`);
        return { success: true };

    } catch (e) {
        const err = e as Error;
        return { error: err.message };
    }
}