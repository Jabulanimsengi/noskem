'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of a single chat conversation we want to manage
interface Chat {
  roomId: string; // e.g., 'chat_order_123'
  orderId: string;
  recipientId: string;
  recipientUsername: string;
  recipientAvatar: string | null;
  itemTitle: string;
}

// Define the shape of the context's value
interface ChatContextType {
  openChats: Chat[];
  openChat: (chat: Chat) => void;
  closeChat: (roomId: string) => void;
}

// Create the context with a default undefined value
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Create the Provider component
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [openChats, setOpenChats] = useState<Chat[]>([]);

  const openChat = (newChat: Chat) => {
    // Prevent opening the same chat multiple times
    setOpenChats(prev => {
      if (prev.find(c => c.roomId === newChat.roomId)) {
        return prev;
      }
      // Limit to 3 open chats at a time for better UI
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

// Create a custom hook for easy access to the context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};