// File: app/chat/[id]/ChatInterface.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../../utils/supabase/client';
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the shape of a chat message
interface Message {
    id: number;
    sender_id: string;
    message: string;
    created_at: string;
}

// Define the props this component accepts
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (data) {
                setMessages(data as Message[]);
            }
        };
        fetchMessages();
    }, [roomId, supabase]);
    
    // Subscribe to real-time updates for new messages from OTHERS
    useEffect(() => {
        const handleNewMessage = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
            const receivedMessage = payload.new as Message;
            // Only add the message if it's from the other user to avoid duplicates
            if (receivedMessage.sender_id !== currentUserId) {
                setMessages((currentMessages) => [...currentMessages, receivedMessage]);
            }
        };

        const channel = supabase
            .channel(roomId)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
                handleNewMessage
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, roomId, currentUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending a new message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = newMessage.trim();
        if (messageText === '') return;

        // --- THIS IS THE FIX ---
        // 1. Immediately clear the input field
        setNewMessage('');

        // 2. Insert the new message and use .select() to get the created row back
        const { data: insertedMessage, error } = await supabase
            .from('chat_messages')
            .insert({
                room_id: roomId,
                sender_id: currentUserId,
                recipient_id: recipientId,
                message: messageText,
            })
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            // Optional: Re-populate the input box with the failed message
            setNewMessage(messageText); 
        } else if (insertedMessage) {
            // 3. Manually add the new message to our local state for an instant update.
            setMessages(currentMessages => [...currentMessages, insertedMessage as Message]);
        }
    };

    return (
        <div className="flex flex-col h-[70vh]">
            {/* Message Display Area */}
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                msg.sender_id === currentUserId
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-600 text-white'
                            }`}
                        >
                            <p>{msg.message}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}