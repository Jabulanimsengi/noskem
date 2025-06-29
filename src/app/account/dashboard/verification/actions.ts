'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface VerificationFormState {
  error?: string | null;
  success?: boolean;
}

export async function submitVerificationAction(
  prevState: VerificationFormState,
  formData: FormData
): Promise<VerificationFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit a verification request.' };
  }

  const idDocument = formData.get('idDocument') as File;
  const proofOfAddress = formData.get('proofOfAddress') as File;

  if (!idDocument || idDocument.size === 0 || !proofOfAddress || proofOfAddress.size === 0) {
    return { error: 'Both ID document and Proof of Address are required.' };
  }

  const uploadFile = async (file: File, fileType: string) => {
    const filePath = `verification-docs/${user.id}/${fileType}-${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(filePath, file);
    
    if (uploadError) {
      throw new Error(`Failed to upload ${fileType}: ${uploadError.message}`);
    }
    return filePath;
  };

  try {
    const idPath = await uploadFile(idDocument, 'id_document');
    const addressPath = await uploadFile(proofOfAddress, 'proof_of_address');

    const documentPayload = {
      idDocumentPath: idPath,
      proofOfAddressPath: addressPath,
      submittedAt: new Date().toISOString()
    };
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        verification_status: 'pending',
        verification_documents: documentPayload
      })
      .eq('id', user.id);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

  } catch (error) {
    const err = error as Error;
    return { error: err.message };
  }

  revalidatePath('/account/dashboard/verification');
  return { success: true };
}