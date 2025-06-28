'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { purchaseCredits } from './actions';
import { useToast } from '@/context/ToastContext';

// Define a more specific type for the Paystack callback response
interface PaystackResponse {
  reference: string;
}

declare global {
  interface Window {
    PaystackPop?: { setup(options: Record<string, unknown>): { openIframe: () => void; }; };
  }
}

interface BuyCreditsButtonProps {
  packageId: number;
  userEmail: string;
  priceZAR: number;
}

export default function BuyCreditsButton({ packageId, userEmail, priceZAR }: BuyCreditsButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!window.PaystackPop) {
      showToast("Payment service not available. Please refresh.", "error");
      return;
    }
    
    if (typeof priceZAR !== 'number' || isNaN(priceZAR) || priceZAR <= 0) {
      showToast("Invalid amount for payment.", "error");
      return;
    }
    if (!userEmail) {
      showToast("A valid email address is required to buy credits.", "error");
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
        showToast("Payment service is not configured correctly.", "error");
        return;
    }

    const paystackConfig = {
      key: publicKey,
      email: userEmail,
      amount: Math.round(priceZAR * 100),
      currency: 'ZAR',
      ref: `credits_${packageId}_${new Date().getTime()}`,
      metadata: { package_id: packageId },
      onClose: () => {},
      callback: (response: PaystackResponse) => {
        (async () => {
          setIsProcessing(true);
          const result = await purchaseCredits(packageId, response.reference);
          
          if (result.success) {
            showToast('Purchase successful! Your credits have been added.', 'success');
            router.refresh(); 
          } else {
            showToast(`An error occurred: ${result.error}`, 'error');
          }
          setIsProcessing(false);
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
          className="w-full block px-6 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400"
        >
          {isProcessing ? 'Processing...' : 'Purchase Now'}
        </button>
    </form>
  );
}