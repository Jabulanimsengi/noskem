'use client';

import { useFormState, useFormStatus } from 'react-dom';
// Import the FormState interface from our actions file
import { createCheckoutSession, type FormState } from './actions';

// Define the initial state using our new interface
const initialState: FormState = {
  error: null,
};

// A small component to show a disabled state while submitting
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-6 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
    >
      {pending ? 'Processing...' : 'Buy Now'}
    </button>
  );
}

// Main form component
export default function BuyNowForm({
  itemId,
  sellerId,
  finalAmount,
}: {
  itemId: number;
  sellerId: string;
  finalAmount: number;
}) {
  // Wire up the hook to our server action and initial state
  const [state, formAction] = useFormState(createCheckoutSession, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden inputs to pass data */}
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="sellerId" value={sellerId} />
      <input type="hidden" name="finalAmount" value={finalAmount} />

      {/* Display any error message returned from the action */}
      {state?.error && (
        <p className="p-3 text-center text-white bg-red-500 rounded-md">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
