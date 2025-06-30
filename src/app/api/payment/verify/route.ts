// src/app/api/payment/verify/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';

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
        const { reference, metadata } = event.data;
        const order_id = metadata?.order_id;

        if (!order_id) {
             return new NextResponse('Webhook metadata is missing order_id.', { status: 400 });
        }
        
        try {
            const supabaseAdmin = createAdminClient();
            // The webhook now only needs to call the powerful database function.
            const { error } = await supabaseAdmin.rpc('process_order_payment', {
                p_order_id: order_id,
                p_paystack_ref: reference
            });

            if (error) {
                console.error(`Webhook Error: RPC call failed for Order #${order_id}`, error);
            }
        } catch (e) {
            console.error('Webhook Exception:', e);
        }
    }

    return new NextResponse('Webhook received', { status: 200 });
}