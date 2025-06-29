// src/app/components/FloatingChatManager.tsx

'use client';

import { useChat } from '@/context/ChatContext';
import FloatingChatWindow from './FloatingChatWindow';
import { createClient } from '../utils/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function FloatingChatManager() {
    const { openChats } = useChat();
    const [user, setUser] = useState<User | null>(null);

    // We need to get the current user to pass to the chat windows
    useEffect(() => {
        const supabase = createClient();
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        fetchUser();
    }, []);

    // If the user isn't logged in or no chats are open, render nothing
    if (!user || openChats.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-0 right-4 flex items-end gap-4 z-50">
            {openChats.map(chat => (
                <FloatingChatWindow
                    key={chat.roomId}
                    chat={chat}
                    currentUser={user} // The user object is passed as `currentUser`
                />
            ))}
        </div>
    );
}