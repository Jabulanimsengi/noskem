'use client';

import { useChat } from '@/context/ChatContext';
import { createClient } from '@/app/utils/supabase/client';
import { useEffect, useState } from 'react';

// This helper function creates a consistent, user-to-user room ID
const createCanonicalRoomId = (userId1: string, userId2: string): string => {
    const sortedIds = [userId1, userId2].sort();
    return `chat_user_${sortedIds[0]}_${sortedIds[1]}`;
};

interface OpenChatButtonProps {
    recipientId: string;
    recipientUsername: string;
    recipientAvatar: string | null;
    itemTitle: string;
}

export default function OpenChatButton({ recipientId, recipientUsername, recipientAvatar, itemTitle }: OpenChatButtonProps) {
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
        if(!currentUserId) return;

        // Use the new canonical room ID logic
        const roomId = createCanonicalRoomId(currentUserId, recipientId);

        openChat({
            roomId: roomId,
            recipientId,
            recipientUsername,
            recipientAvatar,
            itemTitle: itemTitle
        });
    };

    return (
        <button 
            onClick={handleOpenChat}
            className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-dark whitespace-nowrap"
        >
            Contact
        </button>
    );
}