'use client';

import { useChat } from '@/context/ChatContext';
import { type Profile } from '@/types';
import { createClient } from '@/app/utils/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const createCanonicalRoomId = (userId1: string, userId2: string): string => {
    const sortedIds = [userId1, userId2].sort();
    return `chat_user_${sortedIds[0]}_${sortedIds[1]}`;
};

export default function StartChatButton({ recipient }: { recipient: Profile }) {
    const { openChat } = useChat();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        fetchUser();
    }, []);

    const handleOpenChat = () => {
        if (!currentUserId) return;

        const roomId = createCanonicalRoomId(currentUserId, recipient.id);

        openChat({
            roomId: roomId,
            recipientId: recipient.id,
            recipientUsername: recipient.username || 'User',
            recipientAvatar: recipient.avatar_url || null,
            itemTitle: 'Direct Message',
        });
    };

    if (!currentUserId || currentUserId === recipient.id) return null;

    return (
        <Link 
            href="/chat"
            onClick={handleOpenChat}
            className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-dark whitespace-nowrap"
        >
            Message
        </Link>
    );
}