'use client';

import { useChat } from '@/context/ChatContext';

interface OpenChatButtonProps {
    orderId: number;
    recipientId: string;
    recipientUsername: string;
    recipientAvatar: string | null;
    itemTitle: string;
}

export default function OpenChatButton({ orderId, recipientId, recipientUsername, recipientAvatar, itemTitle }: OpenChatButtonProps) {
    const { openChat } = useChat();

    const handleOpenChat = () => {
        openChat({
            roomId: `chat_order_${orderId}`,
            orderId: String(orderId),
            recipientId,
            recipientUsername,
            recipientAvatar,
            itemTitle
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