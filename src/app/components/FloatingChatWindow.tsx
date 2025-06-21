'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import Avatar from './Avatar';
import SharedChatInterface from './SharedChatInterface';
import { FaTimes, FaWindowMinimize } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';

interface FloatingChatWindowProps {
  chat: {
    roomId: string;
    orderId: string;
    recipientId: string;
    recipientUsername: string;
    recipientAvatar: string | null;
  };
  currentUser: User | null;
}

// FIX: This component now handles the "floating" UI but uses the shared component for all chat logic.
export default function FloatingChatWindow({ chat, currentUser }: FloatingChatWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const { closeChat } = useChat();

  if (!currentUser) return null;

  const header = (
    <div className="bg-brand text-white p-2 flex justify-between items-center cursor-pointer rounded-t-lg" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
            <Avatar src={chat.recipientAvatar} alt={chat.recipientUsername} size={28} />
            <span className="font-bold text-sm">{chat.recipientUsername}</span>
        </div>
        <div className="flex items-center gap-2">
            <button title="Minimize" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:bg-brand-dark p-1 rounded-full"><FaWindowMinimize size={14} /></button>
            <button title="Close" onClick={(e) => { e.stopPropagation(); closeChat(chat.roomId); }} className="hover:bg-brand-dark p-1 rounded-full"><FaTimes size={16} /></button>
        </div>
    </div>
  );

  if (isMinimized) {
    return <div className="w-80 shadow-2xl rounded-t-lg fixed bottom-0 right-24">{header}</div>;
  }

  return (
    <div className="w-80 h-[450px] bg-background rounded-lg shadow-2xl flex flex-col border border-gray-300 fixed bottom-0 right-24">
      {header}
      <SharedChatInterface
        roomId={chat.roomId}
        recipientId={chat.recipientId}
        currentUserId={currentUser.id}
        currentUser={currentUser}
        onClose={() => closeChat(chat.roomId)}
      />
    </div>
  );
}