// src/app/agent/dashboard/task/[id]/actions.ts
'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';

interface SubmitInspectionReportResult {
    success: boolean;
    error?: string;
}

export async function submitInspectionReport(formData: FormData): Promise<SubmitInspectionReportResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }

    const orderId = parseInt(formData.get('orderId') as string);
    const conditionMatches = formData.get('conditionMatches') as string;
    const conditionNotes = formData.get('conditionNotes') as string;
    const functionalityMatches = formData.get('functionalityMatches') as string;
    const functionalityNotes = formData.get('functionalityNotes') as string;
    const accessoriesMatches = formData.get('accessoriesMatches') as string;
    const accessoriesNotes = formData.get('accessoriesNotes') as string;
    const finalVerdict = formData.get('finalVerdict') as string;
    const verdictNotes = formData.get('verdictNotes') as string;

    if (!orderId || !conditionMatches || !functionalityMatches || !accessoriesMatches || !finalVerdict || !verdictNotes) {
        return { success: false, error: 'Missing required form fields.' };
    }

    if (finalVerdict === 'rejected' && !verdictNotes) {
        return { success: false, error: 'Verdict notes are required for rejected items.' };
    }

    try {
        // 1. Insert into inspection_reports table
        const { error: insertError } = await supabase
            .from('inspection_reports')
            .insert({
                order_id: orderId,
                agent_id: user.id,
                report_text: JSON.stringify({
                    conditionMatches,
                    conditionNotes,
                    functionalityMatches,
                    functionalityNotes,
                    accessoriesMatches,
                    accessoriesNotes,
                    finalVerdict,
                    verdictNotes,
                }),
                // You might want to store image URLs if the form allowed image uploads
                // image_urls: [],
                admin_notes: null, // Initial admin notes are null
            });

        if (insertError) {
            console.error('Error inserting inspection report:', insertError);
            return { success: false, error: insertError.message };
        }

        // 2. Update the order status based on the final verdict
        let newOrderStatus: 'inspection_passed' | 'inspection_failed';
        if (finalVerdict === 'approved') {
            newOrderStatus = 'inspection_passed';
        } else if (finalVerdict === 'rejected') {
            newOrderStatus = 'inspection_failed';
        } else {
            return { success: false, error: 'Invalid final verdict.' };
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: newOrderStatus })
            .eq('id', orderId)
            .eq('agent_id', user.id); // Ensure only assigned agent can update

        if (updateError) {
            console.error('Error updating order status after inspection:', updateError);
            return { success: false, error: updateError.message };
        }

        revalidatePath(`/agent/dashboard/task/${orderId}`);
        revalidatePath(`/agent/dashboard`);

        return { success: true };

    } catch (e) {
        console.error('Unexpected error during inspection report submission:', e);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}