'use client';

import { useState } from 'react';
import { useChat, type ChatSession } from '@/context/ChatContext';
import Avatar from './Avatar';
import SharedChatInterface from './SharedChatInterface';
import { FaTimes, FaWindowMinimize } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';

interface FloatingChatWindowProps {
  chat: ChatSession;
  // This prop is guaranteed to be a valid User object by the parent component.
  currentUser: User; 
}

export default function FloatingChatWindow({ chat, currentUser }: FloatingChatWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const { closeChat } = useChat();

  // FIX: The redundant 'if (!currentUser)' check has been removed for simplicity and reliability.
  
  const header = (
    <div 
      className="bg-brand text-white p-3 flex justify-between items-center cursor-pointer rounded-t-lg shadow" 
      onClick={() => setIsMinimized(!isMinimized)}
    >
        <div className="flex items-center gap-3">
            <Avatar src={chat.recipientAvatar} alt={chat.recipientUsername} size={32} />
            <div>
              <p className="font-bold text-sm leading-tight">{chat.recipientUsername}</p>
              {chat.itemTitle && <p className="text-xs opacity-80 leading-tight truncate max-w-[150px]">{chat.itemTitle}</p>}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              title="Minimize" 
              aria-label="Minimize chat window" 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} 
              className="hover:bg-brand-dark p-1 rounded-full"
            >
              <FaWindowMinimize size={14} />
            </button>
            <button 
              title="Close" 
              aria-label="Close chat window" 
              onClick={(e) => { e.stopPropagation(); closeChat(chat.roomId); }} 
              className="hover:bg-brand-dark p-1 rounded-full"
            >
              <FaTimes size={16} />
            </button>
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
    <div className="w-80 h-[450px] bg-background rounded-t-lg shadow-2xl flex flex-col border border-b-0 border-gray-300">
      {header}
      <SharedChatInterface
        roomId={chat.roomId}
        recipientId={chat.recipientId}
        currentUser={currentUser}
      />
    </div>
  );
}