// src/app/api/payment/verify/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  // 1. Securely verify the webhook signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("PAYSTACK_SECRET_KEY is not set in environment variables.");
    return new NextResponse('Server configuration error', { status: 500 });
  }

  const signature = request.headers.get('x-paystack-signature');
  const body = await request.text();

  const hash = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    console.warn("Invalid Paystack webhook signature received.");
    return new NextResponse('Invalid signature', { status: 401 });
  }

  // 2. Parse the event payload
  const event = JSON.parse(body);

  // 3. Handle the 'charge.success' event
  if (event.event === 'charge.success') {
    const { reference, metadata, status } = event.data;

    // Ensure the transaction was actually successful
    if (status !== 'success') {
      return NextResponse.json({ message: "Transaction not successful, ignoring." });
    }

    // Extract the order_id from the metadata we sent to Paystack
    const orderId = metadata?.order_id;

    if (!orderId) {
      console.error("Webhook received without an order_id in metadata.", event.data);
      return new NextResponse('Missing required metadata', { status: 400 });
    }

    try {
      // 4. Call our new, robust database function
      const { error: rpcError } = await supabase.rpc('process_verified_payment', {
        p_order_id: orderId,
        p_paystack_ref: reference,
      });

      if (rpcError) {
        console.error(`Error processing verified payment for order #${orderId}:`, rpcError);
        // Even if there's an error (e.g., order already processed), we return a 200
        // to Paystack so it doesn't keep retrying. Our function handles idempotency.
        return new NextResponse(`Error processing order: ${rpcError.message}`, { status: 500 });
      }

      console.log(`Successfully processed payment for order #${orderId}`);
      // 5. Return a success response to Paystack
      return NextResponse.json({ received: true });

    } catch (e) {
      const err = e as Error;
      console.error("Unexpected error in webhook handler:", err.message);
      return new NextResponse('Internal server error', { status: 500 });
    }
  }

  // Acknowledge other event types without processing them
  return NextResponse.json({ message: "Event received" });
}
