// src/app/components/SharedChatInterface.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '../utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import { FaCheck, FaCheckDouble, FaSpinner } from 'react-icons/fa';
import { useToast } from '@/context/ToastContext';

interface Message {
  id: number;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface SharedChatInterfaceProps {
  roomId: string;
  recipientId: string;
  currentUser: User;
}

export default function SharedChatInterface({ roomId, recipientId, currentUser }: SharedChatInterfaceProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const markAsReadOnClient = useCallback(async () => {
    await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .eq('recipient_id', currentUser.id)
        .eq('is_read', false);
  }, [supabase, roomId, currentUser.id]);

  useEffect(() => {
    const channel = supabase.channel(`chat_${roomId}`)
      .on<Message>( 'postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages(currentMessages => {
            if (currentMessages.find(m => m.id === payload.new.id)) {
              return currentMessages;
            }
            // Replace optimistic message with the real one from the database
            return [...currentMessages.filter(m => m.message !== payload.new.message), payload.new];
          });

          if (payload.new.sender_id !== currentUser.id) {
            markAsReadOnClient();
          }
        }
      )
      .on<Message>( 'postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
            setMessages(current => current.map(msg => msg.id === payload.new.id ? payload.new : msg));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, roomId, currentUser.id, markAsReadOnClient]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
      if (data) {
        setMessages(data as Message[]);
        markAsReadOnClient();
      }
    };
    fetchMessages();
  }, [roomId, supabase, markAsReadOnClient]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if (messageText === '') return;

    // Keep your optimistic UI update
    const optimisticMessage: Message = {
      id: Date.now(), // Temporary ID
      sender_id: currentUser.id,
      message: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages(currentMessages => [...currentMessages, optimisticMessage]);
    setNewMessage('');
    setIsSending(true);

    // --- THIS IS THE FIX ---
    // Use the secure 'send_chat_message' RPC function instead of a direct insert.
    // This function runs on the server and correctly sets the sender_id.
    const { error } = await supabase.rpc('send_chat_message', {
        p_recipient_id: recipientId,
        p_message_text: messageText,
        p_room_id: roomId,
    });

    setIsSending(false);

    if (error) {
      showToast(`Error: Message not sent. ${error.message}`, 'error');
      // If the send fails, remove the optimistic message
      setMessages(currentMessages => currentMessages.filter(m => m.id !== optimisticMessage.id));
      return;
    }

    // Send a notification after the message is successfully sent
    await supabase.rpc('create_single_notification', {
      p_profile_id: recipientId,
      p_message: `New message from ${currentUser.user_metadata?.username || 'a user'}`,
      p_link_url: '/chat' 
    });
  };

  return (
    <div className="flex flex-col flex-grow bg-background overflow-hidden">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 text-sm ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl ${msg.sender_id === currentUser.id ? 'bg-brand text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none shadow-sm'}`}>
              <p className="break-words">{msg.message}</p>
            </div>
            {msg.sender_id === currentUser.id && (
                <div className="text-xs text-gray-400 mb-1 flex-shrink-0">
                    {msg.is_read ? <FaCheckDouble className="text-blue-500" /> : <FaCheck />}
                </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 bg-surface border-t flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type a message..." 
            className="flex-grow px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"
            disabled={isSending}
          />
          <button 
            type="submit" 
            disabled={isSending || !newMessage} 
            className="px-5 py-1.5 font-semibold text-white bg-brand rounded-full hover:bg-brand-dark text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSending ? <FaSpinner className="animate-spin" /> : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
