'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from '../../components/actions';

export async function fileInspectionReport(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Authentication failed. Please log in again.' };
  }
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'agent' && profile?.role !== 'admin') {
    return { error: 'Authorization failed. You do not have permission to perform this action.' };
  }

  const orderId = formData.get('orderId') as string;
  const reportText = formData.get('reportText') as string;
  const inspectionResult = formData.get('inspectionResult') as string;
  const imageFiles = formData.getAll('images') as File[];

  if (!orderId || !inspectionResult) {
    return { error: 'Missing required data (Order ID or Inspection Result).' };
  }

  const uploadedImageUrls: string[] = [];
  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      for (const image of imageFiles) {
          const fileName = `${user.id}/${orderId}/${Date.now()}_${image.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('inspection-images').upload(fileName, image);
          if (uploadError) { return { error: `Image upload failed: ${uploadError.message}` }; }
          const { data: { publicUrl } } = supabase.storage.from('inspection-images').getPublicUrl(uploadData.path);
          uploadedImageUrls.push(publicUrl);
      }
  }
  const { error: reportError } = await supabase.from('inspection_reports').insert({
      order_id: parseInt(orderId), agent_id: user.id, report_text: reportText, image_urls: uploadedImageUrls,
  });
  if (reportError) { return { error: 'Failed to save the inspection report.' }; }

  const newStatus = inspectionResult === 'passed' ? 'inspection_passed' : 'inspection_failed';
  
  // Fetch the order details to get the buyer ID and item title for the notification
  const { data: orderData, error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: newStatus, agent_id: user.id })
    .eq('id', parseInt(orderId))
    .select('*, item:item_id(title), buyer:buyer_id(id)')
    .single();

  if (orderUpdateError) { return { error: 'Failed to update the order status.' }; }
  
  // --- NOTIFICATION LOGIC FOR INSPECTION ---
  if(orderData) {
    const itemTitle = orderData.item?.title || 'your item';
    const buyerId = orderData.buyer?.id;
    if(buyerId) {
      let message = '';
      if(newStatus === 'inspection_passed') {
        message = `Good news! ${itemTitle} has passed inspection and will be ready for delivery soon.`;
      } else {
        message = `There's an update on your order for ${itemTitle}. Unfortunately, it failed our inspection. Please check your order details for more information.`;
      }
      await createNotification(buyerId, message, `/account/dashboard/orders`);
    }
  }
  // --- END OF NOTIFICATION LOGIC ---

  revalidatePath('/agent/dashboard');
  return { success: true, error: null };
}

export async function updateOrderStatusByAgent(orderId: number, newStatus: 'in_warehouse' | 'out_for_delivery') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication failed. Please log in again.');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'agent' && profile?.role !== 'admin') {
    throw new Error('Authorization failed. You do not have permission to perform this action.');
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: newStatus, agent_id: user.id })
    .eq('id', orderId)
    .select('*, buyer:buyer_id(id), seller:seller_id(id), item:item_id(title)')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // --- NOTIFICATION LOGIC FOR COLLECTION & DELIVERY ---
  if (order) {
    const itemTitle = order.item?.title || 'your item';
    
    // Notify the SELLER when the item is collected and in the warehouse
    if (newStatus === 'in_warehouse' && order.seller?.id) {
        const message = `Your item "${itemTitle}" has been collected by our agent and is now in our warehouse pending inspection.`;
        await createNotification(order.seller.id, message, `/account/dashboard/orders`);
    }

    // Notify the BUYER when the item is out for delivery
    if (newStatus === 'out_for_delivery' && order.buyer?.id) {
        const message = `Good news! Your item "${itemTitle}" has passed inspection and is now out for delivery.`;
        await createNotification(order.buyer.id, message, `/account/dashboard/orders`);
    }
  }
  // --- END OF NOTIFICATION LOGIC ---

  revalidatePath('/agent/dashboard');
}