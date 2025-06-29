'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { createClient } from '../utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import { useToast } from '@/context/ToastContext';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createNotification } from '@/app/actions'; // Import the new server action

interface Message {
  id: number;
  sender_id: string;
  message: string;
  created_at: string;
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
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch initial messages when the component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
      if (data) {
        setMessages(data as Message[]);
      }
    };
    fetchMessages();
  }, [roomId, supabase]);

  // Set up the real-time subscription for new messages
  useEffect(() => {
    const channel = supabase.channel(`chat_${roomId}`)
      .on<Message>( 'postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          // Add the new message to the state if it's not from the current user
          if (payload.new.sender_id !== currentUser.id) {
            setMessages(currentMessages => [...currentMessages, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, roomId, currentUser.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if (messageText === '' || !currentUser) return;

    // --- FIX 1: Optimistic UI Update ---
    // Create a temporary message object to display immediately.
    const optimisticMessage: Message = {
      id: Date.now(), // Temporary ID
      sender_id: currentUser.id,
      message: messageText,
      created_at: new Date().toISOString(),
    };
    
    // Add the message to our local state right away.
    setMessages(current => [...current, optimisticMessage]);
    setNewMessage('');

    startTransition(async () => {
        // --- FIX 2: Trigger Notification ---
        // Send the message to the database in the background.
        const { error } = await supabase.from('chat_messages').insert({
            room_id: roomId,
            sender_id: currentUser.id,
            recipient_id: recipientId,
            message: messageText,
        });

        if (error) {
          showToast(`Error: ${error.message}`, 'error');
          // If there's an error, remove the optimistic message
          setMessages(current => current.filter(m => m.id !== optimisticMessage.id));
          setNewMessage(messageText); // Restore the input
        } else {
          // If successful, also create a notification for the recipient.
          await createNotification(
              recipientId, 
              `You have a new message from ${currentUser.user_metadata.username || 'a user'}.`,
              '/chat' // Link to the main chat page
          );
        }
    });
  };

  return (
    <div className="flex flex-col flex-grow bg-gray-50 overflow-hidden">
      <div className="flex-grow p-4 space-y-2 overflow-y-auto">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 text-sm ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] px-3 py-2 rounded-xl ${msg.sender_id === currentUser.id ? 'bg-brand text-white rounded-br-none' : 'bg-white text-text-primary rounded-bl-none shadow-sm'}`}>
                <p className="break-words">{msg.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 bg-white border-t flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type a message..." 
            className="flex-grow px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="off"
            disabled={isPending}
          />
          <button 
            type="submit" 
            disabled={!newMessage || isPending}
            className="p-3 bg-brand text-white rounded-full hover:bg-brand-dark text-sm disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}