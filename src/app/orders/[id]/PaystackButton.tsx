'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateOrderStatus } from './actions';
import { useToast } from '@/context/ToastContext';

interface PaystackResponse {
  reference: string;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup(options: Record<string, unknown>): {
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
    
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      showToast("Invalid payment amount provided.", 'error');
      return;
    }
    if (!userEmail) {
      showToast("A valid email address is required to make a payment.", 'error');
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      showToast("Paystack payment service is not configured.", 'error');
      return;
    }

    const paystackConfig = {
      key: publicKey,
      email: userEmail,
      amount: Math.round(amount * 100),
      currency: 'ZAR',
      ref: `order_${orderId}_${new Date().getTime()}`,
      metadata: { orderId: orderId },
      onClose: () => {},
      callback: function (response: PaystackResponse) {
        (async () => {
          setIsProcessing(true);
          const result = await updateOrderStatus(orderId, response.reference);

          if (result.success) {
            showToast('Payment Authorized! The seller will be notified.', 'success');
            router.push(`/orders/${orderId}`);
          } else {
            showToast(result.error || 'An unknown error occurred while updating the order.', 'error');
            setIsProcessing(false);
          }
        })();
      },
    };
    
    const handler = window.PaystackPop.setup(paystackConfig);
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