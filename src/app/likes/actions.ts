'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from 'next/cache';

export async function toggleLikeAction(itemId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to like items." };
    }

    // Check if the user has already liked the item
    const { data: existingLike } = await supabase
        .from('likes')
        .select('user_id, item_id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .single();

    let newLikeStatus: boolean;

    if (existingLike) {
        // User has already liked it, so unlike it
        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', itemId);
        
        if (error) {
            return { error: `Could not remove like: ${error.message}` };
        }
        newLikeStatus = false;
    } else {
        // User has not liked it, so add a like
        const { error } = await supabase
            .from('likes')
            .insert({ user_id: user.id, item_id: itemId });

        if (error) {
            return { error: `Could not like item: ${error.message}` };
        }
        newLikeStatus = true;
    }

    // --- START OF FIX ---
    // Revalidate the layout to ensure the header refetches the new like count.
    revalidatePath('/', 'layout');
    // --- END OF FIX ---

    revalidatePath(`/items/${itemId}`);
    revalidatePath('/account/dashboard/liked');
    
    return { success: true, liked: newLikeStatus };
}

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
    revalidatePath('/', 'layout');
    return { success: true };
}