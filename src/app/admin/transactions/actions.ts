'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/actions";
import { COMMISSION_RATE } from "@/lib/constants";

async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error("Authorization failed: Admins only.");
}

async function executePayout(orderId: number) {
    const supabase = await createClient();
    
    const { error: rpcError } = await supabase.rpc('execute_seller_payout', {
      p_order_id: orderId
    });
    
    if (rpcError) throw new Error(rpcError.message);
}

export async function approvePayoutAction(orderId: number, sellerId: string, finalAmount: number) {
    await verifyAdmin();

    await executePayout(orderId);
    
    const payoutAmount = Math.round(finalAmount * (1 - COMMISSION_RATE));

    await createNotification(
        sellerId,
        `Your payout of R${payoutAmount.toFixed(2)} for order #${orderId} has been approved and processed.`,
        '/account/dashboard/transactions'
    );

    revalidatePath('/admin/transactions');
    revalidatePath('/account/dashboard/transactions');
    revalidatePath('/', 'layout');
}