'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateOrderStatus } from './actions';
import { useToast } from '@/context/ToastContext';

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
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!window.PaystackPop) {
      showToast("Paystack script not loaded. Please refresh the page.", 'error');
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      showToast("Paystack payment service is not configured.", 'error');
      return;
    }
    
    if (amount <= 0) {
        showToast("Invalid amount for payment.", 'error');
        return;
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: userEmail,
      amount: Math.round(amount * 100),
      currency: 'ZAR',
      ref: `order_${orderId}_${new Date().getTime()}`,
      metadata: { orderId: orderId },
      onClose: () => {},
      callback: function (response: any) {
        (async () => {
          setIsProcessing(true);
          const result = await updateOrderStatus(orderId, response.reference);

          if (result.success) {
            showToast('Payment Authorized! The seller will be notified.', 'success');
            // FIX: Navigate to the order page to ensure a clean UI update
            router.push(`/orders/${orderId}`); 
          } else {
            showToast(result.error || 'An unknown error occurred while updating the order.', 'error');
            setIsProcessing(false);
          }
        })();
      },
    });

    handler.openIframe();
  };

  return (
    <form onSubmit={handlePayment}>
      <button
          type="submit"
          disabled={isProcessing}
          className="w-full px-6 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400"
      >
          {isProcessing ? 'Verifying Payment...' : 'Proceed to Payment'}
      </button>
    </form>
  );
}