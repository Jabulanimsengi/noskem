'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from 'zod';
import { createNotification, createBulkNotifications } from '@/lib/notifications';

const inspectionSchema = z.object({
  orderId: z.coerce.number(),
  photos: z.array(z.string().url()).optional(),
  conditionMatches: z.enum(['yes', 'no']),
  conditionNotes: z.string().optional(),
  functionalityMatches: z.enum(['yes', 'no']),
  functionalityNotes: z.string().optional(),
  accessoriesMatches: z.enum(['yes', 'no']),
  accessoriesNotes: z.string().optional(),
  finalVerdict: z.enum(['approved', 'rejected']),
  verdictNotes: z.string().min(1, 'Verdict notes are required.'),
});

export async function acceptTaskAction(orderId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Authentication required.');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'agent') throw new Error('You are not authorized to perform this action.');

    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ agent_id: user.id, status: 'awaiting_assessment' })
        .eq('id', orderId)
        .is('agent_id', null)
        .select('seller_id, items(title)')
        .single();

    if (error) throw new Error(`Failed to accept the task: ${error.message}`);

    if (updatedOrder) {
        // FIX: Access item title correctly
        const itemTitle = updatedOrder.items?.[0]?.title || 'your item';
        await createNotification({
            profile_id: updatedOrder.seller_id,
            message: `An agent has been assigned to your item: "${itemTitle}".`,
            link_url: `/account/dashboard/orders`
        });
    }

    revalidatePath('/agent/dashboard');
    return { success: true, message: 'Task accepted successfully.' };
}

export async function confirmCollectionAction(orderId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Authentication required.');
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'agent') throw new Error('You are not authorized to perform this action.');

    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ status: 'in_warehouse' })
        .eq('id', orderId)
        .eq('agent_id', user.id)
        .select('buyer_id, seller_id, items(title)')
        .single();

    if (error) throw new Error(`Failed to confirm collection: ${error.message}`);

    if (updatedOrder) {
        // FIX: Access item title correctly
        const itemTitle = updatedOrder.items?.[0]?.title || 'your item';
        await createBulkNotifications([
            {
                profile_id: updatedOrder.buyer_id,
                message: `Good news! ${itemTitle} has been collected and is now at our secure warehouse.`,
                link_url: `/orders/${orderId}`
            },
            {
                profile_id: updatedOrder.seller_id,
                message: `Your item "${itemTitle}" has been successfully collected by our agent.`,
                link_url: `/account/dashboard/orders`
            }
        ]);
    }

    revalidatePath('/agent/dashboard');
    return { success: true, message: 'Collection confirmed successfully.' };
}

export async function submitInspectionAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Authentication required.');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'agent') throw new Error('You are not authorized to perform this action.');

    const formObject: { [key: string]: any } = {};
    formData.forEach((value, key) => {
        if (key === 'photos') {
            if (!formObject[key]) formObject[key] = [];
            formObject[key].push(value);
        } else {
            formObject[key] = value;
        }
    });

    const validatedFields = inspectionSchema.safeParse(formObject);

    if (!validatedFields.success) {
        throw new Error(`Invalid form data: ${JSON.stringify(validatedFields.error.flatten())}`);
    }

    const { orderId, photos } = validatedFields.data;

    const { error: inspectionError } = await supabase.from('inspections').insert({
        order_id: orderId,
        agent_id: user.id,
        photos: photos,
        condition_matches: validatedFields.data.conditionMatches === 'yes',
        condition_notes: validatedFields.data.conditionNotes,
        functionality_matches: validatedFields.data.functionalityMatches === 'yes',
        functionality_notes: validatedFields.data.functionalityNotes,
        accessories_matches: validatedFields.data.accessoriesMatches === 'yes',
        accessories_notes: validatedFields.data.accessoriesNotes,
        final_verdict: validatedFields.data.finalVerdict,
        verdict_notes: validatedFields.data.verdictNotes,
        status: 'pending_admin_approval'
    });

    if (inspectionError) {
        throw new Error(`Failed to submit inspection report. Details: ${inspectionError.message}`);
    }

    const { data: updatedOrder, error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'pending_admin_approval' })
        .eq('id', orderId)
        .select('items(title)')
        .single();

    if (orderUpdateError) {
        throw new Error(`Inspection submitted, but failed to update order status: ${orderUpdateError.message}`);
    }

    if (updatedOrder) {
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
        if (admins && admins.length > 0) {
            // FIX: Access item title correctly
            const itemTitle = updatedOrder.items?.[0]?.title || 'an item';
            const adminNotifications = admins.map(admin => ({
                profile_id: admin.id,
                message: `An inspection report for "${itemTitle}" is ready for your review.`,
                link_url: '/admin/inspections'
            }));
            await createBulkNotifications(adminNotifications);
        }
    }

    revalidatePath('/agent/dashboard');
    revalidatePath('/admin/inspections');
    revalidatePath(`/agent/dashboard/task/${orderId}`);
    return { success: true, message: 'Inspection report submitted successfully.' };
}