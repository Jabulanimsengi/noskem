import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { deleteSavedSearch } from './actions';
import { FaTrash } from 'react-icons/fa';

type SavedSearch = {
    id: number;
    search_query: string;
    created_at: string;
};

export default async function SavedSearchesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/?authModal=true');
    }

    const { data: searches, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return <p className="text-red-500">Could not load saved searches.</p>;
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Saved Searches</h2>
            <div className="space-y-3">
                {searches.length > 0 ? (
                    searches.map((search: SavedSearch) => (
                        <div key={search.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <Link href={`/search?q=${encodeURIComponent(search.search_query)}`} className="font-semibold text-brand hover:underline">
                                &quot;{search.search_query}&quot;
                            </Link>
                            <form action={deleteSavedSearch}>
                                <input type="hidden" name="searchId" value={search.id} />
                                <button type="submit" className="text-gray-400 hover:text-red-600" title="Delete search">
                                    <FaTrash />
                                </button>
                            </form>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-8 text-text-secondary">You have no saved searches.</p>
                )}
            </div>
        </div>
    );
}
