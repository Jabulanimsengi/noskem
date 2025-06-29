'use client';

import { useChat, type ChatSession } from '@/context/ChatContext';
import { type Conversation } from '@/types';
import Avatar from '../components/Avatar';
import { useState, useEffect } from 'react';

export default function ConversationItem({ convo }: { convo: Conversation }) {
    const { openChat } = useChat();
    // This state ensures the time is rendered on the client to avoid hydration mismatches
    const [clientTime, setClientTime] = useState('');

    useEffect(() => {
      if (convo.last_message_at) {
        setClientTime(
          new Date(convo.last_message_at).toLocaleTimeString([], {
            hour: '2-digit', 
            minute:'2-digit'
          })
        );
      }
    }, [convo.last_message_at]);


    if (!convo || !convo.other_user) {
        return null; 
    }

    const handleOpenChat = () => {
        const chatSessionData: ChatSession = {
            roomId: convo.room_id,
            recipientId: convo.other_user.id,
            recipientUsername: convo.other_user.username,
            recipientAvatar: convo.other_user.avatar_url,
            itemTitle: convo.item?.title ? `About: ${convo.item.title}` : 'Direct Message'
        };
        
        // --- DEBUGGING LOG ---
        // This will show in your browser console when you click a conversation.
        console.log("ConversationItem clicked. Attempting to open chat with data:", chatSessionData);

        openChat(chatSessionData);
    };

    const isUnread = !convo.is_last_message_read;

    return (
        <button 
            onClick={handleOpenChat}
            className="w-full text-left p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
        >
            <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                    <Avatar src={convo.other_user.avatar_url} alt={convo.other_user.username || 'U'} size={56} />
                    {isUnread && (
                        <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-brand ring-2 ring-white" />
                    )}
                </div>
                
                <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-start">
                        <p className={`font-bold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {convo.other_user.username}
                        </p>
                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {clientTime}
                        </p>
                    </div>
                    
                    <p className={`text-sm truncate ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                        {convo.last_message}
                    </p>
                </div>
            </div>
        </button>
    );
}