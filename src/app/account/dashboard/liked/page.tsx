// src/app/account/dashboard/liked/page.tsx

import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import { type ItemWithSeller, type ItemWithProfile } from '@/types';
import ItemCard from '@/app/components/ItemCard';
import ClearLikesButton from './ClearLikesButton';

export const dynamic = 'force-dynamic';

export default async function LikedItemsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/?authModal=true');
    }

    const { data: likedItemIdsData, error: likesError } = await supabase
        .from('likes')
        .select('item_id')
        .eq('user_id', user.id);

    if (likesError) {
        console.error("Error fetching liked item IDs:", likesError);
        return <p className="text-red-500 text-center p-8">Could not load your liked items.</p>;
    }

    const itemIds = likedItemIdsData.map(like => like.item_id);

    let items: ItemWithProfile[] = [];
    
    if (itemIds.length > 0) {
        // --- THIS IS THE FIX ---
        // The query is now much simpler and only fetches the seller's profile.
        const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select(`
                *,
                profiles:seller_id (*)
            `)
            .in('id', itemIds);

        if (itemsError) {
            console.error("Error fetching liked item details:", itemsError);
            return <p className="text-red-500 text-center p-8">Could not load details for liked items.</p>;
        }
        
        items = (itemsData || []) as ItemWithProfile[];
    }

    return (
        <div>
            <div className="flex justify-end items-center mb-6 -mt-16">
                 <ClearLikesButton hasLikes={items.length > 0} />
            </div>
            
            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <ItemCard key={item.id} item={item} user={user} initialHasLiked={true} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-text-secondary bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg text-text-primary">You haven't liked any items yet.</h3>
                    <p className="mt-1">Click the heart icon on an item to save it here.</p>
                </div>
            )}
        </div>
    );
}