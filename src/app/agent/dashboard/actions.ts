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

  // --- FIX STARTS HERE: Separate Read and Write ---

  // 1. READ the order first to ensure it exists and get seller/item info.
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

  // 2. WRITE the update now that we have the information we need.
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
  
  // 3. NOTIFY the seller using the data we fetched earlier.
  const message = `An agent has been assigned to your item "${itemTitle}" for assessment and collection.`;
  await createNotification(sellerId, message, `/account/dashboard/orders`);
  
  // --- END OF FIX ---

  revalidatePath('/agent/dashboard');
}


// This action is also now fully corrected for array handling.
export async function fileInspectionReport(prevState: any, formData: FormData) {
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

  // --- Image Upload Logic ---
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

  // --- Insert the new Inspection Report ---
  const { error: reportError } = await supabase.from('inspection_reports').insert({
      order_id: orderId,
      agent_id: user.id,
      report_text: `Result: ${inspectionResult.toUpperCase()}\n\nNotes:\n${reportText}`,
      image_urls: uploadedImageUrls
  });

  if (reportError) {
    return { success: false, error: `Failed to save inspection report: ${reportError.message}` };
  }

  // --- If report is saved, THEN update the order status ---
  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: 'pending_admin_approval' })
    .eq('id', orderId);

  if (orderUpdateError) {
    return { success: false, error: `Report saved, but failed to update order status: ${orderUpdateError.message}` };
  }
  
  // --- Notify Admins ---
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
    // FIX: Safely access the item title from the first element of the array.
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