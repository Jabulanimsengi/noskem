'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../utils/supabase/client';
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { FaCheck, FaCheckDouble, FaTimes, FaWindowMinimize } from 'react-icons/fa';
import { useChat } from '@/context/ChatContext';
import { markMessagesAsRead } from '../chat/[id]/actions';
import { createNotification } from './actions';
import Avatar from './Avatar';
import type { User } from '@supabase/supabase-js';

// Define the shape of a chat message
interface Message {
    id: number;
    sender_id: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

// Define the props this component accepts
interface FloatingChatWindowProps {
  chat: {
    roomId: string;
    orderId: string;
    recipientId: string;
    recipientUsername: string;
    recipientAvatar: string | null;
  };
  currentUserId: string;
  currentUser: User | null; // The full user object is needed for notifications
}

export default function FloatingChatWindow({ chat, currentUserId, currentUser }: FloatingChatWindowProps) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const { closeChat } = useChat();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Effect for fetching initial messages and setting up real-time subscriptions
    useEffect(() => {
        markMessagesAsRead(chat.roomId);
        
        const fetchMessages = async () => {
            const { data } = await supabase.from('chat_messages').select('*').eq('room_id', chat.roomId).order('created_at', { ascending: true });
            if (data) setMessages(data as Message[]);
        };
        fetchMessages();

        const channel = supabase.channel(chat.roomId)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${chat.roomId}` }, (payload) => {
                const receivedMessage = payload.new as Message;
                if (receivedMessage.sender_id !== currentUserId) {
                    setMessages(current => [...current, receivedMessage]);
                    markMessagesAsRead(chat.roomId);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${chat.roomId}` }, (payload) => {
                const updatedMessage = payload.new as Message;
                setMessages(current => current.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [chat.roomId, supabase, currentUserId]);
    
    // Effect for scrolling to the bottom of the chat
    useEffect(() => {
        if(!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isMinimized]);

    // Handles sending a message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = newMessage.trim();
        if (messageText === '' || !currentUser) return;
        
        setNewMessage('');

        // Insert the new message and get it back from the server
        const { data: insertedMessage, error } = await supabase
            .from('chat_messages')
            .insert({
                room_id: chat.roomId,
                sender_id: currentUserId,
                recipient_id: chat.recipientId,
                message: messageText,
                is_read: false,
            })
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageText); // Restore message on failure
        } else if (insertedMessage) {
            // Optimistically update the UI
            setMessages(current => [...current, insertedMessage as Message]);
            
            // Create a notification for the other user
            const senderUsername = currentUser.user_metadata?.username || 'a user';
            const notificationMessage = `New message from ${senderUsername}: "${messageText.substring(0, 20)}..."`;
            await createNotification(chat.recipientId, notificationMessage, '/chat');
        }
    };

    // Reusable header for both minimized and maximized states
    const header = (
        <div 
            className="bg-brand text-white p-2 flex justify-between items-center cursor-pointer rounded-t-lg"
            onClick={() => setIsMinimized(!isMinimized)}
        >
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

    // Render only the header if minimized
    if (isMinimized) {
        return (
            <div className="w-72 shadow-2xl rounded-t-lg">
                {header}
            </div>
        );
    }

    // Render the full chat window
    return (
        <div className="w-72 h-96 bg-background rounded-lg shadow-2xl flex flex-col border border-gray-300">
            {header}
            <div className="flex-grow p-2 space-y-3 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 text-sm ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl ${
                            msg.sender_id === currentUserId ? 'bg-brand text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none shadow-sm'
                        }`}>
                            <p className="break-words">{msg.message}</p>
                        </div>
                        {msg.sender_id === currentUserId && (
                             <div className="text-xs text-gray-400 mb-1 flex-shrink-0">
                                {msg.is_read ? <FaCheckDouble className="text-blue-500" /> : <FaCheck />}
                             </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-2 bg-surface border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow px-3 py-1 text-sm bg-background border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"/>
                    <button type="submit" className="px-4 py-1 font-semibold text-white bg-brand rounded-full hover:bg-brand-dark text-sm">Send</button>
                </form>
            </div>
        </div>
    );
}