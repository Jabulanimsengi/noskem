'use client';

import { useChat } from '@/context/ChatContext';
import { type Conversation } from '@/types';
import Avatar from '../components/Avatar';
import { type ChatSession } from '@/context/ChatContext';
// FIX: Import useState and useEffect
import { useState, useEffect } from 'react';

export default function ConversationItem({ convo }: { convo: Conversation }) {
    const { openChat } = useChat();
    // FIX: Create a state to hold the client-side rendered time
    const [clientTime, setClientTime] = useState('');

    // FIX: This effect runs only on the client, after the initial render
    useEffect(() => {
      // Format the time here and store it in state
      setClientTime(
        new Date(convo.last_message_at).toLocaleTimeString([], {
          hour: '2-digit', 
          minute:'2-digit'
        })
      );
    }, [convo.last_message_at]);


    if (!convo || !convo.other_user) {
        return null; 
    }

    const handleOpenChat = () => {
        const chatSession: ChatSession = {
            roomId: convo.room_id,
            recipientId: convo.other_user.id,
            recipientUsername: convo.other_user.username,
            recipientAvatar: convo.other_user.avatar_url,
            itemTitle: convo.item?.title ? `About: ${convo.item.title}` : 'Direct Message'
        };
        openChat(chatSession);
    };

    const isUnread = !convo.is_last_message_read;

    return (
        <button 
            onClick={handleOpenChat}
            className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
        >
            <div className="flex items-center gap-4">
                <Avatar src={convo.other_user.avatar_url} alt={convo.other_user.username || 'U'} size={56} />
                
                <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-text-primary">{convo.other_user.username}</p>
                        {/* FIX: Render the client-side time. It will be empty on the server, preventing a mismatch. */}
                        <p className="text-xs text-text-secondary flex-shrink-0 ml-2">
                            {clientTime}
                        </p>
                    </div>
                    
                    <p className={`text-sm truncate ${isUnread ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                        {convo.last_message}
                    </p>
                </div>
                {isUnread && (
                    <div className="w-3 h-3 bg-brand rounded-full flex-shrink-0 ml-2 self-center animate-pulse"></div>
                )}
            </div>
        </button>
    );
}