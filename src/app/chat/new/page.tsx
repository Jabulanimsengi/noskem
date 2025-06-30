import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import ConversationItem from '../ConversationItem';
import { type Conversation } from '@/types';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { FaHome } from 'react-icons/fa'; // Corrected import
import BackButton from '@/app/components/BackButton';


export default async function ChatHistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { 
        return redirect('/?authModal=true');
    }

    const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: user.id });

    if (error) {
        console.error("Error fetching conversations:", error);
        return <p className="text-red-500 text-center p-8">Could not load your conversations.</p>;
    }

    const conversations: Conversation[] = data || [];

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <BackButton />
                <h1 className="text-3xl font-bold text-text-primary">My Chats</h1>
                <Link href="/" className="text-text-secondary hover:text-brand transition-colors">
                    <FaHome className="h-6 w-6" />
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