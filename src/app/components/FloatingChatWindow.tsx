'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../utils/supabase/client';
import { type RealtimePostgresChangesPayload, type User } from '@supabase/supabase-js';
import { 
    FaCheck, FaCheckDouble, FaTimes, FaWindowMinimize, FaPaperclip
} from 'react-icons/fa';
import { useChat } from '@/context/ChatContext';
import { markMessagesAsRead } from '../chat/[id]/actions';
import { createNotification } from './actions';
import { useToast } from '@/context/ToastContext'; // Import the toast hook
import Avatar from './Avatar';
import Image from 'next/image';

// The interface for a single message
interface Message {
    id: number;
    sender_id: string;
    message: string;
    image_urls: string[] | null;
    created_at: string;
    is_read: boolean;
}

// The props the component accepts
interface FloatingChatWindowProps {
  chat: {
    roomId: string;
    orderId: string;
    recipientId: string;
    recipientUsername: string;
    recipientAvatar: string | null;
  };
  currentUserId: string;
  currentUser: User | null;
}

export default function FloatingChatWindow({ chat, currentUserId, currentUser }: FloatingChatWindowProps) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const { closeChat } = useChat();
    const { showToast } = useToast();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // This useEffect hook handles fetching messages and setting up real-time listeners
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
    
    // This useEffect handles auto-scrolling
    useEffect(() => {
        if(!isMinimized) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isMinimized]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFilesToUpload(prevFiles => {
                const combined = [...prevFiles, ...newFiles];
                return combined.slice(0, 5); // Enforce a limit of 5 files
            });
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = newMessage.trim();
        if ((messageText === '' && filesToUpload.length === 0) || !currentUser) return;
        
        setIsUploading(true);

        try {
            let uploadedImageUrls: string[] = [];

            if (filesToUpload.length > 0) {
                for (const file of filesToUpload) {
                    const filePath = `${currentUser.id}/${chat.roomId}/${Date.now()}_${file.name}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage.from('chat-images').upload(filePath, file);
                    
                    if (uploadError) {
                        throw new Error(`Image upload failed: ${uploadError.message}`);
                    }
                    const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(uploadData.path);
                    uploadedImageUrls.push(publicUrl);
                }
            }

            const { data: insertedMessage, error: insertError } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: chat.roomId,
                    sender_id: currentUserId,
                    recipient_id: chat.recipientId,
                    message: messageText,
                    image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
                    is_read: false,
                })
                .select()
                .single();
            
            if (insertError) {
                throw new Error(`Failed to send message: ${insertError.message}`);
            }

            setNewMessage('');
            setFilesToUpload([]);

            if (insertedMessage) {
                setMessages(current => [...current, insertedMessage as Message]);
                const notificationText = messageText ? `New message: "${messageText.substring(0, 20)}..."` : `Sent ${uploadedImageUrls.length} image(s).`;
                const senderUsername = currentUser.user_metadata?.username || 'a user';
                await createNotification(chat.recipientId, `${senderUsername}: ${notificationText}`, '/chat');
            }

        } catch (error: any) {
            console.error(error);
            showToast(error.message || "An unexpected error occurred.", 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const header = (
        <div className="bg-brand text-white p-2 flex justify-between items-center cursor-pointer rounded-t-lg" onClick={() => setIsMinimized(!isMinimized)}>
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

    if (isMinimized) {
        return <div className="w-80 shadow-2xl rounded-t-lg">{header}</div>;
    }

    return (
        <div className="w-80 h-[450px] bg-background rounded-lg shadow-2xl flex flex-col border border-gray-300">
            {header}
            <div className="flex-grow p-2 space-y-3 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 text-sm ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl ${msg.sender_id === currentUserId ? 'bg-brand text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none shadow-sm'}`}>
                            {msg.image_urls && msg.image_urls.length > 0 && (
                                <div className="grid grid-cols-2 gap-1 mb-2">
                                    {msg.image_urls.map((url, index) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                            <Image src={url} alt={`Chat image ${index + 1}`} width={100} height={100} className="rounded-md object-cover"/>
                                        </a>
                                    ))}
                                </div>
                            )}
                            {msg.message && <p className="break-words">{msg.message}</p>}
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

            {filesToUpload.length > 0 && (
                <div className="p-2 border-t bg-surface">
                    <div className="grid grid-cols-5 gap-2">
                        {filesToUpload.map((file, i) => (
                            <div key={i} className="relative aspect-square">
                                <Image src={URL.createObjectURL(file)} alt="Preview" fill className="rounded-md object-cover" />
                                <button onClick={() => setFilesToUpload(files => files.filter((_, index) => index !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-xs"><FaTimes /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="p-2 bg-surface border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-brand rounded-full" aria-label="Attach images">
                        <FaPaperclip size={18}/>
                    </button>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow px-3 py-1 text-sm bg-background border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"/>
                    <button type="submit" disabled={isUploading} className="px-4 py-1 font-semibold text-white bg-brand rounded-full hover:bg-brand-dark text-sm disabled:bg-gray-400">
                        {isUploading ? 'Sending...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
}