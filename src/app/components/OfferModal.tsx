'use client';

// FIX: Import 'useEffect' from 'react' and 'useFormState' from 'react-dom'.
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createOfferAction, type OfferFormState } from '../offers/actions';
import { useToast } from '@/context/ToastContext';

const initialState: OfferFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark disabled:bg-gray-400">
      {pending ? 'Submitting Offer...' : 'Submit Offer'}
    </button>
  );
}

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemTitle: string;
  sellerId: string;
}

export default function OfferModal({ isOpen, onClose, itemId, itemTitle, sellerId }: OfferModalProps) {
  // FIX: The hook is correctly named useFormState.
  const [state, formAction] = useFormState(createOfferAction, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast('Your offer has been sent to the seller!', 'success');
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
          <h2 className="text-xl font-bold text-text-primary">Make an Offer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <p className="text-text-secondary mb-1">You are making an offer for:</p>
        <p className="font-semibold text-text-primary mb-4">{itemTitle}</p>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="sellerId" value={sellerId} />
          <div>
            <label htmlFor="offerAmount" className="block text-sm font-medium text-text-secondary mb-1">Your Offer Amount (R)</label>
            <input
              type="number"
              id="offerAmount"
              name="offerAmount"
              step="1"
              min="1"
              required
              className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="e.g., 1200"
            />
          </div>
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
