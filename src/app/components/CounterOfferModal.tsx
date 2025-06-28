'use client';

// FIX: Import 'useEffect' from 'react' and 'useFormState' from 'react-dom'.
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { counterOfferAction, type OfferFormState } from '../offers/actions';
import { useToast } from '@/context/ToastContext';

const initialState: OfferFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark disabled:bg-gray-400">
      {pending ? 'Submitting...' : 'Submit Counter-Offer'}
    </button>
  );
}

interface CounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: number;
  currentItemTitle: string;
  currentOfferAmount: number;
}

export default function CounterOfferModal({ isOpen, onClose, offerId, currentItemTitle, currentOfferAmount }: CounterOfferModalProps) {
  // FIX: The hook is correctly named useFormState.
  const [state, formAction] = useFormState(counterOfferAction, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast('Your counter-offer has been sent!', 'success');
      onClose();
    }
    if (state.error) {
      showToast(state.error, 'error');
    }
  }, [state, onClose, showToast]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">Make Counter-Offer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <p className="text-text-secondary mb-1">Item: <span className="font-semibold text-text-primary">{currentItemTitle}</span></p>
        <p className="text-text-secondary mb-4">Current Offer: <span className="font-semibold text-text-primary">R{currentOfferAmount.toFixed(2)}</span></p>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="offerId" value={offerId} />
          <div>
            <label htmlFor="newAmount" className="block text-sm font-medium text-text-secondary mb-1">Your New Price (R)</label>
            <input
              type="number"
              id="newAmount"
              name="newAmount"
              step="1"
              min="1"
              required
              className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="e.g., 1100"
            />
          </div>
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
