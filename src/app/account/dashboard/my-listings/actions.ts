'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { type Item } from '@/types';

const getAuthenticatedUser = async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('You must be logged in to perform this action.');
    }
    return user;
};


export async function deleteItemAction(itemId: number) {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data: item, error: fetchError } = await supabase
        .from('items')
        .select('seller_id')
        .eq('id', itemId)
        .single();

    if (fetchError || !item) {
        throw new Error('Item not found or you do not have permission to delete it.');
    }

    if (item.seller_id !== user.id) {
        throw new Error('You are not authorized to delete this item.');
    }

    const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

    if (deleteError) {
        throw new Error(`Failed to delete item: ${deleteError.message}`);
    }

    revalidatePath('/account/dashboard/my-listings');
    return { success: true, message: 'Listing deleted successfully.' };
}

export async function featureItemAction(itemId: number) {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // In a real app, you would deduct credits here first.
    // This is a placeholder for that logic.
    console.log(`User ${user.id} is featuring item ${itemId}.`);

    const { error } = await supabase
        .from('items')
        .update({ is_featured: true })
        .eq('id', itemId)
        .eq('seller_id', user.id);

    if (error) {
        throw new Error(`Failed to feature item: ${error.message}`);
    }

    revalidatePath('/account/dashboard/my-listings');
    revalidatePath('/'); // Revalidate home page to show featured item
    return { success: true, message: 'Your listing is now featured!' };
}

export async function bumpListingAction(itemId: number) {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Placeholder for credit deduction logic
    console.log(`User ${user.id} is bumping item ${itemId}.`);

    const { error } = await supabase
        .from('items')
        .update({ last_bumped_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('seller_id', user.id);
    
    if (error) {
        throw new Error(`Failed to bump item: ${error.message}`);
    }

    revalidatePath('/account/dashboard/my-listings');
    revalidatePath('/marketplace');
    return { success: true, message: 'Your listing has been bumped to the top.' };
}


export async function setStoreSaleAction(
    previousState: { error?: string; success?: boolean; message?: string },
    formData: FormData
) {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();

        const discountRaw = formData.get('discount');
        const durationRaw = formData.get('duration');

        const discount = discountRaw ? parseInt(discountRaw as string, 10) : NaN;
        const durationDays = durationRaw ? parseInt(durationRaw as string, 10) : NaN;

        if (isNaN(discount) || discount < 5 || discount > 90) {
            return { error: 'Discount must be a number between 5 and 90.' };
        }
        if (isNaN(durationDays) || durationDays <= 0) {
            return { error: 'Please select a valid sale duration.' };
        }

        const saleEndsAt = new Date();
        saleEndsAt.setDate(saleEndsAt.getDate() + durationDays);

        const { error } = await supabase
            .from('profiles')
            .update({
                sale_discount_percentage: discount,
                sale_ends_at: saleEndsAt.toISOString(),
            })
            .eq('id', user.id);

        if (error) {
            throw new Error(`Could not update profile for sale: ${error.message}`);
        }

        revalidatePath('/account/dashboard/my-listings');
        revalidatePath('/marketplace'); // So users see the sale prices

        return { success: true, message: 'Your store-wide sale is now active!' };
    } catch (e) {
        const err = e as Error;
        return { error: err.message };
    }
}

export type UpdateItemFormState = {
    error: string | null;
    success: boolean;
};

export async function updateItemAction(
    previousState: UpdateItemFormState,
    formData: FormData
): Promise<UpdateItemFormState> {
    try {
        const user = await getAuthenticatedUser();
        const supabase = await createClient();

        const itemId = formData.get('itemId');
        if (!itemId) {
            return { error: 'Item ID is missing.', success: false };
        }

        const { data: item, error: fetchError } = await supabase
            .from('items')
            .select('seller_id')
            .eq('id', itemId as string)
            .single();

        if (fetchError || !item) {
            return { error: 'Item not found.', success: false };
        }

        if (item.seller_id !== user.id) {
            return { error: 'You are not authorized to edit this item.', success: false };
        }

        const updatedData: Partial<Item> = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            buy_now_price: parseFloat(formData.get('price') as string),
            category_id: parseInt(formData.get('categoryId') as string, 10),
            condition: formData.get('condition') as Item['condition'],
        };

        const { error: updateError } = await supabase
            .from('items')
            .update(updatedData)
            .eq('id', itemId as string);

        if (updateError) {
            return { error: `Failed to update item: ${updateError.message}`, success: false };
        }

        revalidatePath('/account/dashboard/my-listings');
        revalidatePath(`/items/${itemId}`);

        return { error: null, success: true };
    } catch (e) {
        const err = e as Error;
        return { error: err.message, success: false };
    }
}