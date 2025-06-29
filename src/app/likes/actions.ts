'use server';

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from 'next/cache';
import { createNotification } from "@/app/actions";

export async function mergeGuestLikesAction(itemIds: number[]) {
    if (!itemIds || itemIds.length === 0) {
        return { success: true };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in." };
    }

    const likesToInsert = itemIds.map(id => ({
        user_id: user.id,
        item_id: id
    }));

    // --- START OF FIX ---
    // Use .upsert() with ignoreDuplicates set to true.
    // This will insert new likes and silently ignore any that already exist,
    // which is the correct behavior for merging guest likes.
    const { error } = await supabase
        .from('likes')
        .upsert(likesToInsert, { ignoreDuplicates: true });
    // --- END OF FIX ---

    if (error) {
        return { error: `Could not merge likes: ${error.message}` };
    }

    revalidatePath('/', 'layout');
    revalidatePath('/account/dashboard/liked');
    return { success: true };
}


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