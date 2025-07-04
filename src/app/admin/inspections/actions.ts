// src/app/admin/inspections/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification, createBulkNotifications } from '@/lib/notifications';

// Helper types to fix TypeScript errors
type OrderWithItemTitle = {
  agent_id: string;
  items: { title: string }[] | null;
};
type OrderWithAllDetails = {
  buyer_id: string;
  seller_id: string;
  agent_id: string | null;
  items: { title: string }[] | null;
};

export async function approveInspection(inspectionId: number, orderId: number) {
  const supabase = await createClient();
  
  // FIX: Update the new 'admin_status' column.
  await supabase.from('inspections').update({ admin_status: 'approved' }).eq('id', inspectionId);
  
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
      const orderData = updatedOrder as OrderWithItemTitle;
      const itemTitle = (orderData.items && orderData.items.length > 0) ? orderData.items[0].title : 'your item';
      await createNotification({
          profile_id: orderData.agent_id,
          message: `Your report for "${itemTitle}" was approved. Please proceed to collect the item.`,
          link_url: '/agent/dashboard'
      });
  }

  revalidatePath('/admin/inspections');
  revalidatePath('/agent/dashboard');
}

export async function rejectInspection(inspectionId: number, orderId: number) {
  const supabase = await createClient();

  // FIX: Update the new 'admin_status' column.
  await supabase.from('inspections').update({ admin_status: 'rejected' }).eq('id', inspectionId);
  
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
      const orderData = updatedOrder as OrderWithAllDetails;
      const itemTitle = (orderData.items && orderData.items.length > 0) ? orderData.items[0].title : 'the item';
      const notifications = [
          {
              profile_id: orderData.buyer_id,
              message: `Your order for "${itemTitle}" has been cancelled due to an inspection failure. You will be refunded.`,
              link_url: `/orders/${orderId}`
          },
          {
              profile_id: orderData.seller_id,
              message: `The sale of your item "${itemTitle}" was cancelled because it failed our agent's inspection.`,
              link_url: '/account/dashboard/orders'
          }
      ];
      if (orderData.agent_id) {
          notifications.push({
              profile_id: orderData.agent_id,
              message: `The order for "${itemTitle}" was cancelled following your inspection report.`,
              link_url: '/agent/dashboard'
          });
      }
      await createBulkNotifications(notifications);
  }
  
  revalidatePath('/admin/inspections');
  revalidatePath('/agent/dashboard');
}