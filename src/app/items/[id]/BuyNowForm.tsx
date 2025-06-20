'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createCheckoutSession, type FormState } from './actions';

const initialState: FormState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      // --- FIX: The button now uses the site's brand color ---
      className="w-full px-6 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400"
    >
      {pending ? 'Processing...' : 'Proceed to Payment'}
    </button>
  );
}

export default function BuyNowForm({
  itemId,
  sellerId,
  finalAmount,
}: {
  itemId: number;
  sellerId: string;
  finalAmount: number;
}) {
  const [state, formAction] = useActionState(createCheckoutSession, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="sellerId" value={sellerId} />
      <input type="hidden" name="finalAmount" value={finalAmount} />

      {state?.error && (
        <p className="p-3 text-center text-white bg-red-500 rounded-md">
          {state.error}
        </p>
      )}
      
      {/* --- FIX: Text color is now aligned with the theme --- */}
      <div className="text-center text-sm text-text-secondary">
        A fee of <span className="font-bold text-brand">25 credits</span> will be charged to proceed.
      </div>

      <SubmitButton />
    </form>
  );
}