'use client';

import { useChat } from '@/context/ChatContext';
import { type Conversation } from '@/types'; // We'll update this type next
import Avatar from '../components/Avatar';

export default function ConversationItem({ convo }: { convo: Conversation }) {
    const { openChat } = useChat();

    const handleOpenChat = () => {
        openChat({
            roomId: convo.room_id,
            orderId: convo.room_id.replace('chat_order_', ''),
            recipientId: convo.other_user.id,
            recipientUsername: convo.other_user.username,
            recipientAvatar: convo.other_user.avatar_url,
            itemTitle: convo.item.title
        });
    };

    const isUnread = !convo.is_last_message_read;

    return (
        <button 
            onClick={handleOpenChat}
            className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
        >
            <div className="flex items-center gap-4">
                <Avatar src={convo.other_user.avatar_url} alt={convo.other_user.username} size={56} />
                
                <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-text-primary">{convo.other_user.username}</p>
                        <p className="text-xs text-text-secondary flex-shrink-0 ml-2">
                            {new Date(convo.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    <p className="text-sm text-text-secondary truncate">Item: {convo.item.title}</p>
                    <p className={`text-sm truncate ${isUnread ? 'font-bold text-brand' : 'text-text-secondary'}`}>
                        {convo.last_message}
                    </p>
                </div>
                {isUnread && (
                    <div className="w-3 h-3 bg-brand rounded-full flex-shrink-0 ml-2 self-center"></div>
                )}
            </div>
        </button>
    );
}