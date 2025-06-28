import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import { type ItemWithProfile } from '@/types';
import ItemCard from '@/app/components/ItemCard';
import PageHeader from '@/app/components/PageHeader';
import ClearLikesButton from './ClearLikesButton';

export const dynamic = 'force-dynamic';

export default async function LikedItemsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/?authModal=true');
    }

    // The query remains the same as it correctly fetches the nested data
    const { data: likedItemsData, error } = await supabase
        .from('likes')
        .select(`
            items (
                *,
                profiles (
                    *
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return <p className="text-red-500 text-center p-8">Could not load your liked items.</p>;
    }
    
    // --- START OF THE NEW, MORE ROBUST FIX ---
    // We use .reduce() to build the final array.
    // The initial value is an empty array explicitly typed as ItemWithProfile[].
    const items = (likedItemsData || []).reduce<ItemWithProfile[]>((acc, like) => {
        // For each 'like' object, we check if the nested 'items' property exists and is a valid object.
        const item = like.items;
        if (item && typeof item === 'object' && !Array.isArray(item) && 'id' in item) {
            // If it's valid, we push it to our accumulator array.
            acc.push(item as ItemWithProfile);
        }
        return acc;
    }, []);
    // --- END OF THE NEW, MORE ROBUST FIX ---

    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
            <div className="flex justify-between items-center">
                 <PageHeader title="My Liked Items" />
                 <ClearLikesButton hasLikes={items.length > 0} />
            </div>
            
            {items && items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                    {items.map((item) => (
                        <ItemCard key={item.id} item={item} user={user} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-text-secondary bg-gray-50 rounded-lg mt-6">
                    <h3 className="font-semibold text-lg text-text-primary">You haven't liked any items yet.</h3>
                    <p className="mt-1">Click the heart icon on an item to save it here.</p>
                </div>
            )}
        </div>
    );
}