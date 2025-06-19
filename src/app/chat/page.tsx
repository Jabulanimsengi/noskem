// src/app/chat/page.tsx

import { createClient } from '../utils/supabase/server';
import { redirect } from 'next/navigation';
import ConversationItem from './ConversationItem'; // Import the new component
import { type Conversation } from '@/types'; // Import the shared type

export default async function ChatHistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirect('/auth'); }

    const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: user.id });

    if (error) {
        console.error("Error fetching conversations:", error);
        return <p className="text-red-500 text-center p-8">Could not load your conversations.</p>;
    }

    const conversations: Conversation[] = data || [];

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-6">My Chats</h1>
            <div className="bg-surface rounded-xl shadow-lg">
                <div className="divide-y divide-gray-200">
                    {conversations.length > 0 ? (
                        conversations.map(convo => (
                            <ConversationItem key={convo.room_id} convo={convo} />
                        ))
                    ) : (
                        <p className="p-8 text-center text-text-secondary">You have no active chats.</p>
                    )}
                </div>
            </div>
        </div>
    );
}