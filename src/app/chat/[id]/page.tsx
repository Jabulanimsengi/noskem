// src/app/chat/page.tsx
import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Define the shape of a conversation summary
type Conversation = {
    room_id: string;
    last_message: string;
    last_message_at: string;
    is_last_message_read: boolean;
    other_user: { username: string; avatar_url: string | null; };
    item: { title: string; };
};

export default async function ChatHistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirect('/auth'); }

    // This is a complex query to get all conversations and their latest message
    const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: user.id });

    if (error) {
        console.error("Error fetching conversations:", error);
        return <p className="text-red-500 text-center p-8">Could not load your conversations.</p>;
    }

    const conversations: Conversation[] = data || [];

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">My Chats</h1>
            <div className="bg-surface rounded-xl shadow-lg">
                <div className="space-y-2">
                    {conversations.length > 0 ? (
                        conversations.map(convo => {
                            const orderId = convo.room_id.replace('chat_order_', '');
                            return (
                                <Link key={convo.room_id} href={`/chat/${orderId}`} className="block p-4 border-b border-gray-200 hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                            <Image src={convo.other_user.avatar_url || 'https://placehold.co/64x64'} alt={convo.other_user.username} fill unoptimized/>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-text-primary">{convo.other_user.username}</p>
                                                <p className="text-xs text-text-secondary">{new Date(convo.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                            <p className="text-sm text-text-secondary truncate">Item: {convo.item.title}</p>
                                            <p className={`text-sm truncate ${!convo.is_last_message_read && 'font-bold text-brand'}`}>
                                                {convo.last_message}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <p className="p-8 text-center text-text-secondary">You have no active chats.</p>
                    )}
                </div>
            </div>
        </div>
    );
}