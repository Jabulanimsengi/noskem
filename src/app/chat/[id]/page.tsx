// File: app/chat/[id]/page.tsx

import { createClient } from '../../utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ChatInterface from './ChatInterface'; // We will create this component next

interface ChatPageProps {
  params: {
    id: string; // This will be the order ID
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
    const orderId = params.id;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    // Fetch the order to verify the user is part of this transaction
    const { data: order, error } = await supabase
        .from('orders')
        .select('buyer_id, seller_id, items(title)')
        .eq('id', orderId)
        .single();

    if (error || !order) {
        notFound();
    }

    // Security Check: Ensure the current user is either the buyer or the seller
    if (user.id !== order.buyer_id && user.id !== order.seller_id) {
        // If not, they are not authorized to view this chat.
        return notFound(); 
    }

    // Determine who the other person in the chat is
    const otherUserId = user.id === order.buyer_id ? order.seller_id : order.buyer_id;

    // Fetch the other user's profile to get their username
    const { data: otherUserProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', otherUserId)
        .single();

    // @ts-ignore
    const itemTitle = order.items?.title || 'the item';

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <div className="bg-gray-800 rounded-lg shadow-lg">
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-white">Chat with {otherUserProfile?.username || 'User'}</h1>
                    <p className="text-sm text-gray-400">Regarding your order for: {itemTitle}</p>
                </div>
                {/* Pass the necessary IDs to our client component */}
                <ChatInterface
                    orderId={orderId}
                    currentUserId={user.id}
                    recipientId={otherUserId}
                />
            </div>
        </div>
    );
}