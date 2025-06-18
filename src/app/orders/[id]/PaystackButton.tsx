// File: app/orders/[id]/PaystackButton.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateOrderStatus } from './actions';

// This interface helps TypeScript recognize the PaystackPop object from the window
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
      // --- THIS IS THE FIX ---
      // The callback itself is a regular function.
      callback: function (response: any) {
        // We create a self-invoking async function inside it to handle our logic.
        (async () => {
          setIsProcessing(true);
          console.log('Payment successful, reference:', response.reference);

          const result = await updateOrderStatus(orderId, response.reference);

          if (result.success) {
            alert('Payment Authorized! Waiting for seller to ship.');
            router.refresh();
          } else {
            setError(result.error || 'An unknown error occurred while updating the order.');
            setIsProcessing(false); // Make sure to stop processing on error
          }
          // Note: setIsProcessing(false) is not needed on success because the page refreshes.
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
        className="w-full px-6 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600"
      >
        {isProcessing ? 'Updating Order...' : 'Proceed to Payment'}
      </button>
    </div>
  );
}