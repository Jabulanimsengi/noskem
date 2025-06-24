'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Action to start the MFA enrollment process
export async function enrollMfaAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in.' };
    }

    // Generate a new Time-based One-Time Password (TOTP) factor
    const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
    });

    if (error) {
        return { error: `Enrollment failed: ${error.message}` };
    }

    // FIX: After enrolling, immediately list the factors on the server to get the new factorId.
    // This avoids the race condition of trying to do this on the client.
    const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();

    if (listError) {
        return { error: `Could not list factors after enrolling: ${listError.message}` };
    }

    const newFactor = factorsData.totp[factorsData.totp.length - 1];
    if (!newFactor) {
        return { error: 'Could not find the newly created factor.' };
    }

    // FIX: Return the QR code AND the new factor ID together.
    return { 
        qrCodeDataUrl: data.totp.qr_code,
        factorId: newFactor.id
    };
}

// Action to verify the code from the authenticator app and enable MFA
export async function verifyMfaAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in.' };
    }

    const factorId = formData.get('factorId') as string;
    const code = formData.get('code') as string;

    if (!factorId || !code) {
        return { error: 'Factor ID and verification code are required.' };
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
    });

    if (error) {
        return { error: `Verification failed: ${error.message}` };
    }

    revalidatePath('/account/dashboard/profile');
    return { success: true };
}

// Action to disable MFA for a given factor
export async function unenrollMfaAction(factorId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in.' };
    }

    if (!factorId) {
        return { error: 'Factor ID is required to unenroll.' };
    }

    const { error } = await supabase.auth.mfa.unenroll({
        factorId,
    });

    if (error) {
        return { error: `Failed to unenroll: ${error.message}` };
    }

    revalidatePath('/account/dashboard/profile');
    return { success: true };
}