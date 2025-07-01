// src/lib/paystack.ts

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

interface PaystackPayload {
    email: string;
    amount: number;
    metadata?: object;
    callback_url?: string;
}

export async function initializeTransaction(payload: PaystackPayload) {
    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Payment service is not configured.');
    }

    const finalPayload = {
        ...payload,
        callback_url: payload.callback_url || `${process.env.NEXT_PUBLIC_SITE_URL}/orders/payment-callback`
    };

    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalPayload),
    });

    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(`Payment provider error: ${responseData.message}`);
    }
    return responseData;
}

// FIX: Added the missing verifyTransaction function
export async function verifyTransaction(reference: string) {
    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Payment service is not configured.');
    }

    const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(`Payment verification error: ${responseData.message}`);
    }

    return responseData;
}