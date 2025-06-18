// File: app/chat/[id]/ChatInterface.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../../utils/supabase/client';

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

    // Unique channel name for this specific order chat
    const roomId = `chat_order_${orderId}`;

    // Function to scroll to the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch initial messages when the component loads
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (data) {
                setMessages(data);
            }
        };

        fetchMessages();
    }, [roomId, supabase]);
    
    // Subscribe to real-time updates for new messages
    useEffect(() => {
        const channel = supabase
            .channel(roomId)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
                (payload) => {
                    setMessages((currentMessages) => [...currentMessages, payload.new as Message]);
                }
            )
            .subscribe();

        // Clean up the subscription when the component unmounts
        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, roomId]);

    // Scroll to bottom whenever new messages are added
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending a new message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const { error } = await supabase
            .from('chat_messages')
            .insert({
                room_id: roomId,
                sender_id: currentUserId,
                recipient_id: recipientId,
                message: newMessage.trim(),
            });

        if (error) {
            console.error('Error sending message:', error);
        } else {
            setNewMessage(''); // Clear the input box
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