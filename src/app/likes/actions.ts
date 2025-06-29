'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from 'next/cache';

export async function toggleLikeAction(itemId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to like items." };
    }

    const { data: existingLike } = await supabase
        .from('likes')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .single();

    let newLikeStatus: boolean;

    if (existingLike) {
        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', itemId);
        
        if (error) { return { error: `Could not remove like: ${error.message}` }; }
        newLikeStatus = false;
    } else {
        const { error } = await supabase
            .from('likes')
            .insert({ user_id: user.id, item_id: itemId });

        if (error) { return { error: `Could not like item: ${error.message}` }; }
        newLikeStatus = true;
    }

    revalidatePath('/', 'layout');
    revalidatePath('/account/dashboard/liked');
    
    return { success: true, liked: newLikeStatus };
}

// This function was missing and is now added and exported.
export async function clearAllLikesAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in." };
    }

    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id);
    
    if (error) {
        return { error: `Could not clear likes: ${error.message}` };
    }

    revalidatePath('/account/dashboard/liked');
    revalidatePath('/', 'layout'); // Revalidate layout to update header count
    return { success: true };
}