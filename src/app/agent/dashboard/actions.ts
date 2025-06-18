// File: app/agent/dashboard/actions.ts

'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// This is the action that handles an agent filing an inspection report.
export async function fileInspectionReport(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // 1. Get the current user and verify their role is 'agent' or 'admin'.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Authentication failed. Please log in again.' };
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'agent' && profile?.role !== 'admin') {
    return { error: 'Authorization failed. You do not have permission to perform this action.' };
  }

  // 2. Get all the necessary data from the form submission.
  const orderId = formData.get('orderId') as string;
  const reportText = formData.get('reportText') as string;
  const inspectionResult = formData.get('inspectionResult') as string; // This will be 'passed' or 'failed'.
  const imageFiles = formData.getAll('images') as File[];

  if (!orderId || !inspectionResult) {
    return { error: 'Missing required data (Order ID or Inspection Result).' };
  }

  // 3. Upload any provided images to the 'inspection-images' storage bucket.
  const uploadedImageUrls: string[] = [];
  // Check if the first file has a size greater than 0 to see if files were actually selected.
  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      for (const image of imageFiles) {
        // Create a unique path for each image to prevent overwrites.
        const fileName = `${user.id}/${orderId}/${Date.now()}_${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('inspection-images') // Ensure this bucket is public in your Supabase dashboard.
          .upload(fileName, image);

        if (uploadError) {
          console.error('Image upload failed:', uploadError);
          return { error: `Image upload failed: ${uploadError.message}` };
        }
        
        // Get the public URL of the uploaded image.
        const { data: { publicUrl } } = supabase.storage
          .from('inspection-images')
          .getPublicUrl(uploadData.path);
        uploadedImageUrls.push(publicUrl);
      }
  }

  // 4. Insert the new inspection report into the 'inspection_reports' table.
  const { error: reportError } = await supabase.from('inspection_reports').insert({
      order_id: parseInt(orderId),
      agent_id: user.id,
      report_text: reportText,
      image_urls: uploadedImageUrls,
  });

  if (reportError) {
      console.error('Error saving inspection report:', reportError);
      return { error: 'Failed to save the inspection report to the database.' };
  }

  // 5. Update the main order's status based on the inspection result.
  const newStatus = inspectionResult === 'passed' ? 'inspection_passed' : 'inspection_failed';
  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: newStatus, agent_id: user.id })
    .eq('id', parseInt(orderId));

  if (orderUpdateError) {
      console.error('Error updating order status:', orderUpdateError);
      return { error: 'Failed to update the order status after filing the report.' };
  }

  // 6. Revalidate the path to ensure the dashboard UI updates immediately.
  revalidatePath('/agent/dashboard');
  
  // Return a success state to the form.
  return { success: true, error: null };
}