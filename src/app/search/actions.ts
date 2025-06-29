'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSearchAction(searchQuery: string) {
    if (!searchQuery || searchQuery.trim() === '') {
        return { error: 'A search query is required.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to save a search.' };
    }

    const { error } = await supabase
        .from('saved_searches')
        .insert({ user_id: user.id, search_query: searchQuery.trim() });

    if (error) {
        if (error.code === '23505') {
            return { success: true, message: 'Search already saved.' };
        }
        return { error: `Could not save search: ${error.message}` };
    }
    
    revalidatePath('/account/dashboard/saved-searches');
    return { success: true, message: 'Search saved successfully!' };
}

// The function now accepts formData to match the expected signature.
export async function deleteSavedSearchAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in.' };
    }

    // The ID is read from the form's hidden input field.
    const searchId = parseInt(formData.get('searchId') as string, 10);
    
    if (isNaN(searchId)) {
        return { error: 'Invalid search ID.' };
    }

    const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', user.id);

    if (error) {
        return { error: `Could not delete saved search: ${error.message}` };
    }

    revalidatePath('/account/dashboard/saved-searches');
    return { success: true };
}
