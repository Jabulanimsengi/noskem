import { createClient } from '../utils/supabase/server';
import { redirect } from 'next/navigation';
import ConversationItem from './ConversationItem';
import { type Conversation } from '@/types';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default async function ChatHistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // This is correct: redirect only if the user is not logged in.
    if (!user) { 
        return redirect('/?authModal=true');
    }

    // This function fetches all conversations for the current user.
    // It does NOT redirect.
    const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: user.id });

    if (error) {
        console.error("Error fetching conversations:", error);
        return <p className="text-red-500 text-center p-8">Could not load your conversations.</p>;
    }

    const conversations: Conversation[] = data || [];

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">My Chats</h1>
                <Link href="/chat/new" className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark flex items-center gap-2">
                    <MessageSquare size={16} />
                    New Message
                </Link>
            </div>
            <div className="bg-surface rounded-xl shadow-lg">
                <div className="divide-y divide-gray-200">
                    {conversations.length > 0 ? (
                        conversations.map(convo => (
                            <ConversationItem key={convo.room_id} convo={convo} />
                        ))
                    ) : (
                        <div className="text-center py-16 text-text-secondary">
                            <MessageSquare className="mx-auto text-4xl mb-4 text-gray-300" />
                            <h3 className="font-semibold text-lg text-text-primary">No conversations yet</h3>
                            <p className="mt-1">Click "New Message" to start a chat with another user.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}