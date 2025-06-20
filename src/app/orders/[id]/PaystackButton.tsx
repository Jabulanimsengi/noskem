'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateOrderStatus } from './actions';

declare global {
  interface Window {
    PaystackPop?: {
      setup(options: any): {
        openIframe: () => void;
      };
    };
  }
}

interface PaystackButtonProps {
  orderId: number;
  userEmail: string;
  amount: number;
}

export default function PaystackButton({ orderId, userEmail, amount }: PaystackButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setError(null);
    if (!window.PaystackPop) {
      setError("Paystack script not loaded.");
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setError("Paystack public key not configured.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: userEmail,
      amount: Math.round(amount * 100),
      currency: 'ZAR',
      ref: `order_${orderId}_${new Date().getTime()}`,
      metadata: {
        orderId: orderId,
      },
      onClose: () => {
        console.log('Payment window closed by user.');
      },
      callback: function (response: any) {
        (async () => {
          setIsProcessing(true);
          const result = await updateOrderStatus(orderId, response.reference);

          if (result.success) {
            sessionStorage.setItem('pendingToast', JSON.stringify({
                message: 'Payment Authorized! Waiting for seller to ship.',
                type: 'success'
            }));
            router.refresh();
          } else {
            setError(result.error || 'An unknown error occurred while updating the order.');
            setIsProcessing(false);
          }
        })();
      },
    });

    handler.openIframe();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-center text-white bg-red-500 rounded-md">
          {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full px-6 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400"
      >
        {isProcessing ? 'Updating Order...' : 'Proceed to Payment'}
      </button>
    </div>
  );
}