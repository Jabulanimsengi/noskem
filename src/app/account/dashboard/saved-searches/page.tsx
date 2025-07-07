// src/app/account/dashboard/saved-searches/page.tsx

import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FaTrash } from 'react-icons/fa';
import SavedSearchList from './SavedSearchList'; // We will create this client component

// This is the type for a single saved search
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

    // Fetch the initial list of saved searches on the server
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
            {/* The list is now rendered by a client component */}
            <SavedSearchList initialSearches={searches as SavedSearch[]} />
        </div>
    );
}