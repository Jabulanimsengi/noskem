// src/app/orders/payment-callback/page.tsx

'use client';

import { useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function PaymentCallbackPage() {
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        // Show a success message to the user.
        showToast('Payment successful! Your order is being processed.', 'success');

        // Redirect the user to their transaction history after a short delay.
        const timer = setTimeout(() => {
            router.push('/account/dashboard/transactions');
        }, 3000); // 3-second delay

        // Cleanup the timer if the component unmounts.
        return () => clearTimeout(timer);
    }, [showToast, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-gray-600">Your order is being processed and we're redirecting you to your account...</p>
            {/* Optional: Add a spinner/loading indicator here */}
        </div>
    );
}