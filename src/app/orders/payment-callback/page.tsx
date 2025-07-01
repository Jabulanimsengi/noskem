// src/app/orders/payment-callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPaymentAction } from './actions';
import { FaSpinner } from 'react-icons/fa';

export default function PaymentCallbackPage() {
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const reference = searchParams.get('reference');

        // This function will run once when the component mounts.
        const handleVerification = async (ref: string) => {
            const result = await verifyPaymentAction(ref);

            if (result.success) {
                showToast('Payment successful!', 'success');
                // Redirect immediately on success
                router.push('/account/dashboard/transactions');
            } else {
                showToast(result.error || 'Payment verification failed.', 'error');
                router.push('/account/dashboard');
            }
        };

        if (reference) {
            handleVerification(reference);
        } else {
            // Handle cases where the page is loaded without a reference
            showToast('Invalid payment callback.', 'error');
            router.push('/');
        }
        
    // We only want this to run once, so we pass an empty dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <FaSpinner className="animate-spin text-brand h-12 w-12 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Verifying Your Payment...</h1>
            <p className="text-gray-600">Please do not close this window. We are confirming your transaction.</p>
        </div>
    );
}