/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated to fix the error from your screenshot.
 *
 * Change Made:
 * - Added the missing `FloatingChatWindowProps` interface definition. This resolves
 * the 'Cannot find name' TypeScript error.
 */
'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import Avatar from './Avatar';
import SharedChatInterface from './SharedChatInterface';
import { FaTimes, FaWindowMinimize } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';

// FIX: Define the missing props interface
interface FloatingChatWindowProps {
  chat: {
    roomId: string;
    orderId: string;
    recipientId: string;
    recipientUsername: string;
    recipientAvatar: string | null;
    itemTitle: string; // This was missing from the previous analysis but is in the context
  };
  currentUser: User | null;
}

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
            <button title="Minimize" aria-label="Minimize chat window" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:bg-brand-dark p-1 rounded-full"><FaWindowMinimize size={14} /></button>
            <button title="Close" aria-label="Close chat window" onClick={(e) => { e.stopPropagation(); closeChat(chat.roomId); }} className="hover:bg-brand-dark p-1 rounded-full"><FaTimes size={16} /></button>
        </div>
    </div>
  );

  if (isMinimized) {
    return (
        <div className="w-80 shadow-2xl rounded-t-lg">
            {header}
        </div>
    );
  }

  return (
    <div className="w-80 h-[450px] bg-background rounded-t-lg shadow-2xl flex flex-col border border-gray-300">
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