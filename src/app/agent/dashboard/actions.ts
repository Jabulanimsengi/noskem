'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/app/actions';

export async function assignToAgentAction(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication failed.');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'agent') throw new Error('Authorization failed.');

  const { data: orderData, error: fetchError } = await supabase
    .from('orders')
    .select('seller_id, items (title)')
    .eq('id', orderId)
    .eq('status', 'payment_authorized')
    .single();

  if (fetchError || !orderData) {
    throw new Error(`Failed to assign order #${orderId}. It may have already been accepted or does not exist.`);
  }

  const sellerId = orderData.seller_id;
  const item = Array.isArray(orderData.items) ? orderData.items[0] : orderData.items;
  const itemTitle = item?.title || 'Unknown Item';

  if (!sellerId) {
      throw new Error(`Could not find a valid seller for order #${orderId}`);
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      agent_id: user.id,
      status: 'awaiting_assessment' 
    })
    .eq('id', orderId);
  
  if (updateError) {
      throw new Error(`Failed to update order #${orderId}: ${updateError.message}`);
  }
  
  const message = `An agent has been assigned to your item "${itemTitle}" for assessment and collection.`;
  await createNotification(sellerId, message, `/account/dashboard/orders`);

  revalidatePath('/agent/dashboard');
}

export async function fileInspectionReport(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication failed.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'agent') return { success: false, error: 'Authorization failed.' };

  const orderId = parseInt(formData.get('orderId') as string);
  const reportText = formData.get('reportText') as string;
  const inspectionResult = formData.get('inspectionResult') as string;
  const imageFiles = formData.getAll('images') as File[];

  if (!orderId || !inspectionResult) {
    return { success: false, error: 'Missing required data.' };
  }

  const uploadedImageUrls: string[] = [];
  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      for (const image of imageFiles) {
          const fileName = `inspections/${orderId}/${Date.now()}_${image.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('inspection-images').upload(fileName, image);
          if (uploadError) return { success: false, error: `Image upload failed: ${uploadError.message}` };
          const { data: { publicUrl } } = supabase.storage.from('inspection-images').getPublicUrl(uploadData.path);
          uploadedImageUrls.push(publicUrl);
      }
  }

  const { error: reportError } = await supabase.from('inspection_reports').insert({
      order_id: orderId,
      agent_id: user.id,
      report_text: `Result: ${inspectionResult.toUpperCase()}\n\nNotes:\n${reportText}`,
      image_urls: uploadedImageUrls
  });

  if (reportError) {
    return { success: false, error: `Failed to save inspection report: ${reportError.message}` };
  }

  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: 'pending_admin_approval' })
    .eq('id', orderId);

  if (orderUpdateError) {
    return { success: false, error: `Report saved, but failed to update order status: ${orderUpdateError.message}` };
  }
  
  const { data: orderDetails } = await supabase
    .from('orders')
    .select('id, item:items(title)')
    .eq('id', orderId)
    .single<{
        id: number;
        item: { title: string }[] | null
    }>();
    
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  
  if (admins && orderDetails) {
    const item = orderDetails.item?.[0];
    const itemTitle = item?.title || 'Unknown Item';
    
    const adminMessage = `Inspection report for Order #${orderDetails.id} (${itemTitle}) has been filed and requires your approval.`;
    for (const admin of admins) {
      await createNotification(admin.id, adminMessage, `/admin/inspections`); 
    }
  }

  revalidatePath('/agent/dashboard');
  revalidatePath('/admin/inspections');
  return { success: true, error: null };
}

export async function confirmCollectionAction(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication failed.');

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('agent_id, buyer_id, seller_id, items(title)')
    .eq('id', orderId)
    .single();

  if (fetchError || !order || order.agent_id !== user.id) {
    throw new Error('You are not authorized to perform this action.');
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'in_warehouse' })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order status: ${updateError.message}`);
  }

  const item = Array.isArray(order.items) ? order.items[0] : order.items;
  const itemTitle = item?.title || 'the item';
  const message = `Good news! ${itemTitle} (Order #${orderId}) has been collected and is now at our secure warehouse. It will be dispatched for delivery soon.`;
  await createNotification(order.buyer_id, message, `/account/dashboard/orders`);
  await createNotification(order.seller_id, message, `/account/dashboard/orders`);

  revalidatePath('/agent/dashboard');
  revalidatePath('/account/dashboard/orders');
}