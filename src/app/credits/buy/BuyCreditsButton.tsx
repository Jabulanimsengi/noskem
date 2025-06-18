// File: app/credits/buy/BuyCreditsButton.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { purchaseCredits } from './actions';

// This interface helps TypeScript recognize the PaystackPop object
declare global {
  interface Window {
    PaystackPop?: { setup(options: any): { openIframe: () => void; }; };
  }
}

// Define the shape of props the button will accept
interface BuyCreditsButtonProps {
  packageId: number;
  userEmail: string;
  priceZAR: number;
}

export default function BuyCreditsButton({ packageId, userEmail, priceZAR }: BuyCreditsButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    if (!window.PaystackPop) {
      alert("Paystack script not loaded. Please refresh the page.");
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      alert("Paystack is not configured correctly.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: userEmail,
      amount: Math.round(priceZAR * 100), // Convert Rands to cents
      currency: 'ZAR',
      ref: `credits_${packageId}_${new Date().getTime()}`,
      metadata: { package_id: packageId },
      onClose: () => console.log('Payment window closed.'),
      callback: (response: any) => {
        (async () => {
          setIsProcessing(true);
          const result = await purchaseCredits(packageId, response.reference);
          if (result.success) {
            alert('Purchase successful! Your new credits have been added.');
            // Refresh the page to show the updated balance in the header
            router.refresh(); 
          } else {
            alert(`An error occurred: ${result.error}`);
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
      className="w-full px-6 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600"
    >
      {isProcessing ? 'Processing...' : 'Buy Now'}
    </button>
  );
}