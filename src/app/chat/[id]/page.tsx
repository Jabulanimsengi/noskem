import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import ChatInterface from './ChatInterface';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft } from 'react-icons/fa';

interface ChatPageProps {
  params: { id: string };
}

// FIX: Corrected comment to reflect the file's actual purpose.
// This page displays a specific chat interface for a given order ID.
export default async function ChatPage({ params }: ChatPageProps) {
    const supabase = await createClient();
    const orderId = params.id;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/?authModal=true&redirect=/chat/${orderId}`);
    }

    const { data: order } = await supabase
        .from('orders')
        .select(`*, item:items!inner(*), seller:seller_id!inner(*), buyer:buyer_id!inner(*)`)
        .eq('id', orderId)
        .single();
    
    if (!order) notFound();

    const isUserInvolved = user.id === order.seller.id || user.id === order.buyer.id;
    if (!isUserInvolved) notFound();

    const recipient = user.id === order.seller.id ? order.buyer : order.seller;

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="bg-surface rounded-xl shadow-lg">
                <div className="p-4 border-b flex items-center gap-4">
                    <Link href="/chat" className="text-text-secondary hover:text-text-primary p-2">
                        <FaArrowLeft />
                    </Link>
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <Image src={order.item.images?.[0] || 'https://placehold.co/64x64'} alt={order.item.title} fill className="object-cover" />
                    </div>
                    <div>
                        <p className="font-bold text-text-primary">{order.item.title}</p>
                        <p className="text-sm text-text-secondary">Chat with {recipient.username}</p>
                    </div>
                </div>
                <ChatInterface
                    orderId={orderId}
                    currentUserId={user.id}
                    recipientId={recipient.id}
                    currentUser={user}
                />
            </div>
        </div>
    );
}