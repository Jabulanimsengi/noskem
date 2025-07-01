'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { verifyTransaction } from '@/lib/paystack';

export async function verifyPaymentAction(reference: string) {
    console.log(`[ACTION LOG] 1. Starting payment verification for reference: ${reference}`);

    try {
        // This function call is where the request to Paystack happens.
        console.log("[ACTION LOG] 2. Calling verifyTransaction from Paystack library...");
        const transactionDetails = await verifyTransaction(reference);
        console.log("[ACTION LOG] 3. Received response from Paystack API.");

        if (transactionDetails.data.status !== 'success') {
            console.error(`[ACTION LOG] ERROR: Payment status from Paystack is not 'success'. Status: ${transactionDetails.data.status}`);
            return { error: 'Payment not successful according to Paystack.' };
        }

        const metadata = transactionDetails.data.metadata;
        const orderId = metadata?.order_id;

        if (!orderId) {
            console.error("[ACTION LOG] ERROR: Order ID not found in transaction metadata.");
            return { error: 'Order ID not found in transaction metadata.' };
        }

        console.log(`[ACTION LOG] 4. Verification successful. Updating order #${orderId} in database.`);
        const supabase = await createClient();
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'payment_authorized', paystack_ref: reference })
            .eq('id', orderId);

        if (updateError) {
            console.error(`[ACTION LOG] ERROR: Database update failed: ${updateError.message}`);
            return { error: `Database Error: ${updateError.message}` };
        }

        console.log(`[ACTION LOG] 5. Order #${orderId} updated successfully. Revalidating paths.`);
        revalidatePath('/account/dashboard/orders');
        revalidatePath('/account/dashboard/transactions');

        return { success: true };

    } catch (error) {
        const err = error as Error;
        // This will catch errors like a wrong secret key or network issues.
        console.error(`[ACTION LOG] FATAL ERROR during verification action: ${err.message}`);
        return { error: err.message };
    }
}