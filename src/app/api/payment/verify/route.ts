import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { createNotification, createBulkNotifications } from '@/lib/notifications';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: Request) {
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(body).digest('hex');

    if (hash !== signature) {
        return new NextResponse('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
        const { metadata } = event.data;
        const order_id = metadata?.order_id;
        const user_id = metadata?.user_id;

        if (!order_id || !user_id) {
             return new NextResponse('Webhook metadata is missing order_id or user_id.', { status: 400 });
        }
        
        try {
            const supabaseAdmin = createAdminClient();
            const { error: rpcError } = await supabaseAdmin.rpc('process_order_payment', {
                p_order_id: order_id,
                p_buyer_id: user_id, 
                p_paystack_ref: event.data.reference
            });

            if (rpcError) {
                console.error(`Webhook Error: RPC call failed for Order #${order_id}`, rpcError);
                return new NextResponse('Error processing order', { status: 500 });
            }

            const { data: orderDetails } = await supabaseAdmin
                .from('orders')
                .select('seller_id, items(title)')
                .eq('id', order_id)
                .single();

            if (orderDetails) {
                // FIX: Access the item title from the first element of the array.
                const itemTitle = orderDetails.items?.[0]?.title || 'Your item';
                
                await createNotification({
                    profile_id: orderDetails.seller_id,
                    message: `Congratulations! Your item "${itemTitle}" has been sold.`,
                    link_url: `/account/dashboard/orders`
                });

                const { data: agents } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('role', 'agent');

                if (agents && agents.length > 0) {
                    const agentNotifications = agents.map(agent => ({
                        profile_id: agent.id,
                        message: `New Task Available: Awaiting assessment for "${itemTitle}".`,
                        link_url: '/agent/dashboard'
                    }));
                    await createBulkNotifications(agentNotifications);
                }
            }

        } catch (e) {
            console.error('Webhook Exception:', e);
            return new NextResponse('Internal Server Error', { status: 500 });
        }
    }

    return new NextResponse('Webhook received', { status: 200 });
}