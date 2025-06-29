'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface DisputeFormState {
  error?: string | null;
  success?: boolean;
}

export async function submitDisputeMessageAction(
  prevState: DisputeFormState,
  formData: FormData
): Promise<DisputeFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  const orderId = parseInt(formData.get('orderId') as string);
  const message = formData.get('message') as string;
  const imageFiles = formData.getAll('images') as File[];

  if (!orderId || !message) {
    return { error: 'Order ID and message are required.' };
  }

  // --- File Upload Logic ---
  const uploadedImageUrls: string[] = [];
  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
    for (const image of imageFiles) {
      if (image.size > 5 * 1024 * 1024) { // 5MB limit per file
        return { error: `File ${image.name} is too large. Max size is 5MB.`};
      }
      const fileName = `disputes/${orderId}/${user.id}-${Date.now()}-${image.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dispute-evidence') // A new bucket for evidence
        .upload(fileName, image);
      
      if (uploadError) {
        return { success: false, error: `Image upload failed: ${uploadError.message}` };
      }
      const { data: { publicUrl } } = supabase.storage.from('dispute-evidence').getPublicUrl(uploadData.path);
      uploadedImageUrls.push(publicUrl);
    }
  }
  // --- End File Upload ---

  const { error: insertError } = await supabase.from('dispute_messages').insert({
    order_id: orderId,
    profile_id: user.id,
    message: message,
    image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
  });

  if (insertError) {
    return { error: `Failed to submit message: ${insertError.message}` };
  }

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}