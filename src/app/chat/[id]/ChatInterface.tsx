// src/app/chat/[id]/ChatInterface.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../../utils/supabase/client';
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';
import { markMessagesAsRead } from './actions';

interface Message {
    id: number;
    sender_id: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

interface ChatInterfaceProps {
    orderId: string;
    currentUserId: string;
    recipientId: string;
}

export default function ChatInterface({ orderId, currentUserId, recipientId }: ChatInterfaceProps) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const roomId = `chat_order_${orderId}`;

    useEffect(() => {
        // Mark messages as read when the component mounts
        markMessagesAsRead(roomId);
        
        const fetchMessages = async () => {
            const { data } = await supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
            if (data) setMessages(data as Message[]);
        };
        fetchMessages();
    }, [roomId, supabase]);
    
    useEffect(() => {
        const handleNewMessage = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
            const receivedMessage = payload.new as Message;
            setMessages((current) => [...current, receivedMessage]);
            // If the new message is from the other user, mark it as read immediately
            if(receivedMessage.sender_id !== currentUserId) {
                markMessagesAsRead(roomId);
            }
        };

        const channel = supabase.channel(roomId)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, handleNewMessage)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
                // When a message is updated (e.g., is_read becomes true), refresh the state
                const updatedMessage = payload.new as Message;
                setMessages(current => current.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, roomId, currentUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = newMessage.trim();
        if (messageText === '') return;
        setNewMessage('');

        await supabase.from('chat_messages').insert({
            room_id: roomId,
            sender_id: currentUserId,
            recipient_id: recipientId,
            message: messageText,
            is_read: false, // Sent messages are initially unread
        });
    };

    return (
        <div className="flex flex-col bg-background" style={{height: '70vh'}}>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                            msg.sender_id === currentUserId ? 'bg-brand text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none shadow-sm'
                        }`}>
                            <p>{msg.message}</p>
                        </div>
                        {msg.sender_id === currentUserId && (
                             <div className="text-xs text-gray-400 mb-1">
                                {msg.is_read ? <FaCheckDouble className="text-blue-500" /> : <FaCheck />}
                             </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-surface border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow px-4 py-2 text-text-primary bg-background border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button type="submit" className="px-6 py-2 font-semibold text-white bg-brand rounded-full hover:bg-brand-dark">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}