import { type User } from '@supabase/supabase-js';
import { type Profile } from '@/types';
import Avatar from '@/app/components/Avatar';
import Image from 'next/image';

type DisputeMessage = {
    id: number;
    created_at: string;
    message: string;
    image_urls: string[] | null;
    profiles: Profile | null;
}

interface DisputeTimelineProps {
    messages: DisputeMessage[];
    currentUser: User;
}

export default function DisputeTimeline({ messages, currentUser }: DisputeTimelineProps) {
    return (
        <div className="space-y-6">
            {messages.map((msg) => {
                const isCurrentUser = msg.profiles?.id === currentUser.id;
                return (
                    <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0">
                            <Avatar src={msg.profiles?.avatar_url} alt={msg.profiles?.username || 'User'} size={40} />
                        </div>
                        <div className={`p-4 rounded-xl max-w-lg ${isCurrentUser ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-bold text-sm">{isCurrentUser ? 'You' : msg.profiles?.username}</p>
                                <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                            </div>
                            <p className="text-text-secondary">{msg.message}</p>
                            {msg.image_urls && msg.image_urls.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {msg.image_urls.map((url, index) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                            <Image src={url} alt={`Evidence ${index + 1}`} width={80} height={80} className="rounded-md object-cover" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}