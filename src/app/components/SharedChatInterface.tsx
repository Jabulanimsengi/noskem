/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Changes Made:
 * - Suggestion #35 (Performance): Implemented concurrent image uploads. Instead of
 * uploading images in a sequential loop, `Promise.all` is now used to upload
 * all files simultaneously, significantly reducing the total upload time.
 * - Suggestion #36 (Security): Added a comment to acknowledge the low-risk XSS
 * potential when creating notification text from user input.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../utils/supabase/client';
import { type RealtimePostgresChangesPayload, type User } from '@supabase/supabase-js';
import { FaCheck, FaCheckDouble, FaPaperclip, FaTimes } from 'react-icons/fa';
import { useToast } from '@/context/ToastContext';
import { markMessagesAsRead } from '../chat/[id]/actions';
import { createNotification } from './actions';
import Avatar from './Avatar';
import Image from 'next/image';

interface Message {
  id: number;
  sender_id: string;
  message: string;
  image_urls: string[] | null;
  created_at: string;
  is_read: boolean;
}

interface SharedChatInterfaceProps {
  roomId: string;
  recipientId: string;
  currentUserId: string;
  currentUser: User | null;
  onClose?: () => void;
}

export default function SharedChatInterface({ roomId, recipientId, currentUserId, currentUser, onClose }: SharedChatInterfaceProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const { showToast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    markMessagesAsRead(roomId);
    
    const fetchMessages = async () => {
      const { data } = await supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    fetchMessages();

    const channel = supabase.channel(`chat_${roomId}`)
      .on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
          setMessages(current => [...current, payload.new as Message]);
          if (payload.new.sender_id !== currentUserId) {
            markMessagesAsRead(roomId);
          }
      })
      .on<Message>('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages(current => current.map(msg => msg.id === payload.new.id ? (payload.new as Message) : msg));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, supabase, currentUserId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles].slice(0, 5));
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
        // Create an array of upload promises
        const uploadPromises = filesToUpload.map(file => {
          const filePath = `${currentUserId}/${roomId}/${Date.now()}_${file.name}`;
          return supabase.storage.from('chat-images').upload(filePath, file);
        });

        // Execute all promises concurrently
        const uploadResults = await Promise.all(uploadPromises);

        // Process results
        for (const result of uploadResults) {
            if (result.error) throw new Error(`Image upload failed: ${result.error.message}`);
            uploadedImageUrls.push(supabase.storage.from('chat-images').getPublicUrl(result.data.path).data.publicUrl);
        }
      }

      const { error: insertError } = await supabase.from('chat_messages').insert({
          room_id: roomId, sender_id: currentUserId, recipient_id: recipientId,
          message: messageText, image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
      });
      if (insertError) throw new Error(`Failed to send message: ${insertError.message}`);
      
      setNewMessage('');
      setFilesToUpload([]);
      
      // Note: Sanitize user input if it were ever to be rendered as HTML.
      // Here it's used as plain text, so the risk is low.
      const notificationText = messageText ? `New message: "${messageText.substring(0, 20)}..."` : `Sent ${uploadedImageUrls.length} image(s).`;
      const recipientPath = `/chat/${roomId.replace('chat_order_', '')}`;
      await createNotification(recipientId, `${currentUser.user_metadata?.username || 'a user'}: ${notificationText}`, recipientPath);
    } catch (error: any) {
      showToast(error.message || "An error occurred.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col bg-background h-full">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 text-sm ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl ${msg.sender_id === currentUserId ? 'bg-brand text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none shadow-sm'}`}>
              {msg.image_urls && msg.image_urls.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 mb-2">
                      {msg.image_urls.map((url, index) => <a key={index} href={url} target="_blank" rel="noopener noreferrer"><Image src={url} alt={`Chat image ${index + 1}`} width={100} height={100} className="rounded-md object-cover"/></a>)}
                  </div>
              )}
              {msg.message && <p className="break-words">{msg.message}</p>}
            </div>
            {msg.sender_id === currentUserId && (<div className="text-xs text-gray-400 mb-1 flex-shrink-0">{msg.is_read ? <FaCheckDouble className="text-blue-500" /> : <FaCheck />}</div>)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {filesToUpload.length > 0 && (
        <div className="p-2 border-t bg-surface">
          <div className="grid grid-cols-5 gap-2">
            {filesToUpload.map((file, i) => (<div key={i} className="relative aspect-square"><Image src={URL.createObjectURL(file)} alt="Preview" fill className="rounded-md object-cover" /><button onClick={() => setFilesToUpload(files => files.filter((_, index) => index !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-xs"><FaTimes /></button></div>))}
          </div>
        </div>
      )}
      
      <div className="p-2 bg-surface border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-brand rounded-full" aria-label="Attach images"><FaPaperclip size={18}/></button>
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow px-3 py-1.5 text-sm bg-background border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"/>
          <button type="submit" disabled={isUploading} className="px-5 py-1.5 font-semibold text-white bg-brand rounded-full hover:bg-brand-dark text-sm disabled:bg-gray-400">{isUploading ? '...' : 'Send'}</button>
        </form>
      </div>
    </div>
  );
}