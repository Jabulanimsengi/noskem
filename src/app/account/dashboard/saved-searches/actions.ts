// src/app/account/dashboard/saved-searches/actions.ts
'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// The action now returns a structured response
export async function deleteSavedSearch(searchId: number): Promise<{ success: boolean; message: string }> {
    // --- THIS IS THE FIX ---
    // Added the 'await' keyword here
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Authentication required.' };
    }

    const { error } = await supabase
        .from('saved_searches')
        .delete()
        .match({ id: searchId, user_id: user.id }); // Ensures users can only delete their own searches

    if (error) {
        console.error('Error deleting saved search:', error);
        return { success: false, message: 'Failed to delete search.' };
    }

    revalidatePath('/account/dashboard/saved-searches');
    return { success: true, message: 'Search deleted.' };
}