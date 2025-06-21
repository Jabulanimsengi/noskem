'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

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
  const { error: orderUpdateError } = await supabase.from('orders').update({ status: newStatus, agent_id: user.id }).eq('id', parseInt(orderId));
  if (orderUpdateError) { return { error: 'Failed to update the order status.' }; }

  revalidatePath('/agent/dashboard');
  return { success: true, error: null };
}