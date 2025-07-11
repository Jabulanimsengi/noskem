// src/app/account/dashboard/orders/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { COMMISSION_RATE } from '@/lib/constants';
import { createNotification } from '@/app/actions';

// Helper to get the authenticated user or throw an error
async function getAuthenticatedUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Authentication required.');
    }
    return user;
}

// --- NEW CANCEL ACTION ---
// This function now calls our new all-in-one database function.
export async function cancelPendingOrder(orderId: number) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = createClient();

    // Call the new RPC function
    const { error } = await supabase.rpc('cancel_order_and_refund', {
      p_order_id: orderId,
      p_buyer_id: user.id
    });

    if (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }

    revalidatePath('/account/dashboard/orders');
    revalidatePath('/items'); // Revalidate item pages as well

    return { success: true, message: 'Order cancelled successfully.' };

  } catch (error) {
    const err = error as Error;
    return { success: false, message: err.message };
  }
}


// --- Your other existing actions ---

export async function confirmReceipt(orderId: number): Promise<void> {
  const user = await getAuthenticatedUser();
  const supabase = createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, buyer_id, status, items(seller_id)')
    .eq('id', orderId)
    .single();
  
  if (error || !order) throw new Error("Order not found.");
  if (order.buyer_id !== user.id) throw new Error("You are not authorized to confirm receipt for this order.");
  if (order.status !== 'delivered') throw new Error("Order must be delivered before receipt can be confirmed.");

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) throw new Error("Failed to update order status.");
  
  const sellerId = order.items && typeof order.items === 'object' && !Array.isArray(order.items)
    ? (order.items as { seller_id: string }).seller_id
    : null;

  if (sellerId) {
    await createNotification(sellerId, `The buyer has confirmed receipt for order #${orderId}. You can now claim your funds.`, '/account/dashboard/orders');
  }

  revalidatePath('/account/dashboard/orders');
}

export async function claimSellerFunds(orderId: number): Promise<void> {
  const user = await getAuthenticatedUser();
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('seller_id, status, final_amount')
    .eq('id', orderId)
    .single();
    
  if (!order) throw new Error("Order not found.");
  if (order.seller_id !== user.id) throw new Error("You are not authorized to claim funds for this order.");
  if (order.status !== 'completed') throw new Error("Funds can only be claimed for completed orders.");

  const payoutAmount = order.final_amount * (1 - COMMISSION_RATE);

  const { error: rpcError } = await supabase.rpc('execute_seller_payout', { p_order_id: orderId });

  if (rpcError) {
      throw new Error(`Payout failed: ${rpcError.message}`);
  }

  await createNotification(user.id, `R${payoutAmount.toFixed(2)} in credits has been added to your account for order #${orderId}.`, '/account/dashboard/transactions');
  
  revalidatePath('/account/dashboard/orders');
  revalidatePath('/account/dashboard/transactions');
  revalidatePath('/', 'layout');
}

export async function requestReturnAction(orderId: number): Promise<void> {
  const user = await getAuthenticatedUser();
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('buyer_id, status')
    .eq('id', orderId)
    .single();
    
  if (!order || order.buyer_id !== user.id) {
    throw new Error('You are not authorized to dispute this order.');
  }
  if (order.status !== 'delivered') {
    throw new Error('This order cannot be disputed at this time.');
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'disputed' })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Could not file dispute: ${updateError.message}`);
  }

  revalidatePath('/account/dashboard/orders');
}