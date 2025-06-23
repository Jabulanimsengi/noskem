'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Defines the information needed for a single chat session
export interface ChatSession {
  roomId: string; // A unique ID for the chat room, e.g., "chat_user_1_user_2"
  recipientId: string;
  recipientUsername: string;
  recipientAvatar: string | null;
  itemTitle?: string; // Optional: The item the chat is about
}

// Defines the functions our chat context will provide
interface ChatContextType {
  openChats: ChatSession[];
  openChat: (chat: ChatSession) => void;
  closeChat: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// The provider component that will wrap our application
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [openChats, setOpenChats] = useState<ChatSession[]>([]);

  const openChat = (newChat: ChatSession) => {
    setOpenChats(prev => {
      // If the chat is already open, don't add it again
      if (prev.some(c => c.roomId === newChat.roomId)) {
        return prev;
      }
      // Add the new chat and limit to 3 windows to avoid screen clutter
      return [...prev, newChat].slice(-3);
    });
  };

  const closeChat = (roomId: string) => {
    setOpenChats(prev => prev.filter(c => c.roomId !== roomId));
  };

  return (
    <ChatContext.Provider value={{ openChats, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
};

// A custom hook for easy access to the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};