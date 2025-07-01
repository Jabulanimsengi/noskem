'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification, createBulkNotifications } from '@/lib/notifications';

/**
 * Approves an inspection and notifies the agent.
 */
export async function approveInspection(inspectionId: number, orderId: number) {
  const supabase = await createClient();
  
  const { error: inspectionError } = await supabase
    .from('inspections')
    .update({ status: 'approved' })
    .eq('id', inspectionId);

  if (inspectionError) {
    throw new Error(`Failed to approve inspection: ${inspectionError.message}`);
  }

  const { data: updatedOrder, error: orderError } = await supabase
    .from('orders')
    .update({ status: 'awaiting_collection' })
    .eq('id', orderId)
    .select('agent_id, items(title)')
    .single();
  
  if (orderError) {
    console.error(`Inspection ${inspectionId} approved, but failed to update order ${orderId}: ${orderError.message}`);
  }

  if (updatedOrder?.agent_id) {
      // FIX: Access the item title from the first element of the array.
      const itemTitle = updatedOrder.items?.[0]?.title || 'your item';
      await createNotification({
          profile_id: updatedOrder.agent_id,
          message: `Your report for "${itemTitle}" was approved. Please proceed to collect the item.`,
          link_url: '/agent/dashboard'
      });
  }

  revalidatePath('/admin/inspections');
  revalidatePath('/agent/dashboard');
}

/**
 * Rejects an inspection and notifies all parties.
 */
export async function rejectInspection(inspectionId: number, orderId: number) {
  const supabase = await createClient();

  const { error: inspectionError } = await supabase
    .from('inspections')
    .update({ status: 'rejected' })
    .eq('id', inspectionId);

  if (inspectionError) {
    throw new Error(`Failed to reject inspection: ${inspectionError.message}`);
  }
  
  const { data: updatedOrder, error: orderError } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select('buyer_id, seller_id, agent_id, items(title)')
    .single();

  if (orderError) {
    console.error(`Inspection ${inspectionId} rejected, but failed to update order ${orderId}: ${orderError.message}`);
  }
  
  if (updatedOrder) {
      // FIX: Access the item title from the first element of the array.
      const itemTitle = updatedOrder.items?.[0]?.title || 'the item';
      const notifications = [
          {
              profile_id: updatedOrder.buyer_id,
              message: `Your order for "${itemTitle}" has been cancelled due to an inspection failure. You will be refunded.`,
              link_url: `/orders/${orderId}`
          },
          {
              profile_id: updatedOrder.seller_id,
              message: `The sale of your item "${itemTitle}" was cancelled because it failed our agent's inspection.`,
              link_url: '/account/dashboard/orders'
          }
      ];
      if (updatedOrder.agent_id) {
          notifications.push({
              profile_id: updatedOrder.agent_id,
              message: `The order for "${itemTitle}" was cancelled following your inspection report.`,
              link_url: '/agent/dashboard'
          });
      }
      await createBulkNotifications(notifications);
  }
  
  revalidatePath('/admin/inspections');
  revalidatePath('/agent/dashboard');
}