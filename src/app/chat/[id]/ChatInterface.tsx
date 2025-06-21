'use client';

import SharedChatInterface from '@/app/components/SharedChatInterface';
import { type User } from '@supabase/supabase-js';

interface ChatInterfaceProps {
  orderId: string;
  currentUserId: string;
  recipientId: string;
  currentUser: User | null; // Pass the full user object
}

// FIX: This component is now just a simple wrapper around the shared chat interface.
export default function ChatInterface({ orderId, currentUserId, recipientId, currentUser }: ChatInterfaceProps) {
    const roomId = `chat_order_${orderId}`;

    return (
        <div className="bg-surface rounded-b-lg border-x border-b border-gray-200" style={{height: '70vh'}}>
            <SharedChatInterface
                roomId={roomId}
                recipientId={recipientId}
                currentUserId={currentUserId}
                currentUser={currentUser}
            />
        </div>
    );
}