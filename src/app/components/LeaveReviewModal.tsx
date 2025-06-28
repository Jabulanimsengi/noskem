'use client';

// FIX: Import hooks from 'react' and 'react-dom' correctly.
import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitReviewAction, type ReviewFormState } from '../reviews/actions';
import { useToast } from '@/context/ToastContext';
import { FaStar } from 'react-icons/fa';

const initialState: ReviewFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark disabled:bg-gray-400">
      {pending ? 'Submitting...' : 'Submit Review'}
    </button>
  );
}

const StarRating = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <label key={index}>
                        <input type="radio" name="rating" value={ratingValue} onClick={() => setRating(ratingValue)} className="hidden" />
                        <FaStar
                            size={32}
                            className="cursor-pointer transition-colors"
                            color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                        />
                    </label>
                );
            })}
        </div>
    );
};

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  sellerId: string;
  itemTitle: string;
}

export default function LeaveReviewModal({ isOpen, onClose, orderId, sellerId, itemTitle }: LeaveReviewModalProps) {
  // FIX: The hook is correctly named useFormState.
  const [state, formAction] = useFormState(submitReviewAction, initialState);
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (state.success) {
      showToast('Thank you! Your review has been submitted.', 'success');
      onClose();
    }
    if (state.error) {
      showToast(state.error, 'error');
    }
  }, [state, onClose, showToast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">Leave a Review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <p className="text-text-secondary mb-1">You are reviewing your purchase of:</p>
        <p className="font-semibold text-text-primary mb-4">{itemTitle}</p>

        <form action={formAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="sellerId" value={sellerId} />
          <input type="hidden" name="rating" value={rating} />
          
          <StarRating rating={rating} setRating={setRating} />

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-text-secondary mb-1">Your Comments (Optional)</label>
            <textarea
              name="comment"
              id="comment"
              rows={4}
              placeholder="How was your experience with this seller?"
              className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md"
            />
          </div>
          <div className="mt-4">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
