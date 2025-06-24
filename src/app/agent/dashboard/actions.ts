'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/app/actions';

/**
 * Allows a logged-in agent to assign an order to themselves,
 * changing the order status to 'awaiting_assessment'.
 * @param orderId The ID of the order to accept.
 */
export async function assignToAgentAction(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication failed. Please log in again.');
  }
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'agent' && profile?.role !== 'admin') {
    throw new Error('Authorization failed. You do not have permission to perform this action.');
  }

  // Update the order status and assign the current agent's ID
  const { data: order, error } = await supabase
    .from('orders')
    .update({ 
      status: 'awaiting_assessment', 
      agent_id: user.id 
    })
    .eq('id', orderId)
    .select('*, seller:seller_id(id), item:item_id(title)')
    .single();

  if (error) {
    throw new Error(`Failed to assign order: ${error.message}`);
  }

  // Notify the seller that an agent has been assigned
  if (order && order.seller) {
    const message = `An agent has been assigned to your item "${order.item?.title || ''}" for assessment and collection.`;
    await createNotification(order.seller.id, message, `/account/dashboard/orders`);
  }

  revalidatePath('/agent/dashboard');
}

/**
 * Allows an agent to file their inspection report, which saves the report
 * and moves the order status to 'pending_admin_approval'.
 * @param prevState The previous state from useActionState.
 * @param formData The form data from the inspection modal.
 */
export async function fileInspectionReport(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Authentication failed. Please log in again.' };
  }
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'agent' && profile?.role !== 'admin') {
    return { success: false, error: 'Authorization failed. You do not have permission to perform this action.' };
  }

  const orderId = formData.get('orderId') as string;
  const reportText = formData.get('reportText') as string;
  const inspectionResult = formData.get('inspectionResult') as string; // This will be 'passed' or 'failed'
  const imageFiles = formData.getAll('images') as File[];

  if (!orderId || !inspectionResult) {
    return { success: false, error: 'Missing required data (Order ID or Inspection Result).' };
  }

  // 1. Upload any inspection images to storage
  const uploadedImageUrls: string[] = [];
  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      for (const image of imageFiles) {
          const fileName = `inspections/${orderId}/${Date.now()}_${image.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('inspection-images').upload(fileName, image);
          if (uploadError) {
            return { success: false, error: `Image upload failed: ${uploadError.message}` };
          }
          const { data: { publicUrl } } = supabase.storage.from('inspection-images').getPublicUrl(uploadData.path);
          uploadedImageUrls.push(publicUrl);
      }
  }

  // 2. Save the inspection report details to the 'inspection_reports' table
  const { error: reportError } = await supabase.from('inspection_reports').insert({
      order_id: parseInt(orderId),
      agent_id: user.id,
      // We can combine the pass/fail result with the notes for the report text
      report_text: `Result: ${inspectionResult.toUpperCase()}\n\nNotes:\n${reportText}`,
      image_urls: uploadedImageUrls,
  });

  if (reportError) {
    return { success: false, error: `Failed to save the inspection report: ${reportError.message}` };
  }

  // 3. Update the order status to 'pending_admin_approval'
  const { data: orderData, error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: 'pending_admin_approval' })
    .eq('id', parseInt(orderId))
    .select('*, item:item_id(title)')
    .single();

  if (orderUpdateError) {
    return { success: false, error: `Failed to update the order status: ${orderUpdateError.message}` };
  }

  // 4. Notify all admins that a report is ready for their review
  if(orderData) {
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (admins) {
      const adminMessage = `Inspection report for Order #${orderData.id} (${orderData.item?.title}) has been filed and requires your approval.`;
      for (const admin of admins) {
        // Link to the admin page for inspections
        await createNotification(admin.id, adminMessage, `/admin/inspections`); 
      }
    }
  }

  revalidatePath('/agent/dashboard');
  revalidatePath('/admin/inspections');
  return { success: true, error: null };
}