'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { purchaseCredits } from './actions';
import { useToast } from '@/context/ToastContext';

declare global {
  interface Window {
    PaystackPop?: { setup(options: any): { openIframe: () => void; }; };
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

  const handlePayment = () => {
    if (!window.PaystackPop) {
      showToast("Payment service not available. Please refresh.", "error");
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
        showToast("Payment service is not configured correctly.", "error");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: userEmail,
      amount: Math.round(priceZAR * 100),
      currency: 'ZAR',
      ref: `credits_${packageId}_${new Date().getTime()}`,
      metadata: { package_id: packageId },
      onClose: () => console.log('Payment window closed.'),
      callback: (response: any) => {
        (async () => {
          setIsProcessing(true);
          const result = await purchaseCredits(packageId, response.reference);
          
          if (result.success) {
            sessionStorage.setItem('pendingToast', JSON.stringify({ 
              message: 'Purchase successful! Your credits have been added.', 
              type: 'success' 
            }));
            router.refresh(); 
          } else {
            showToast(`An error occurred: ${result.error}`, 'error');
          }
          setIsProcessing(false);
        })();
      },
    });

    handler.openIframe();
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing}
      className="w-full block px-6 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400"
    >
      {isProcessing ? 'Processing...' : 'Purchase Now'}
    </button>
  );
}