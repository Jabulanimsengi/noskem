'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitDisputeMessageAction, type DisputeFormState } from './dispute_actions';
import { useToast } from '@/context/ToastContext';

const initialState: DisputeFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-6 py-3 font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400"
    >
      {pending ? 'Submitting...' : 'Submit Message'}
    </button>
  );
}

export default function DisputeForm({ orderId }: { orderId: number }) {
  const [state, formAction] = useFormState(submitDisputeMessageAction, initialState);
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) {
      showToast(state.error, 'error');
    }
    if (state.success) {
      showToast('Your message has been added to the dispute.', 'success');
      formRef.current?.reset();
    }
  }, [state, showToast]);

  return (
    <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-bold mb-4">Add to Dispute</h3>
        <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="orderId" value={orderId} />
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-1">Your Message</label>
                <textarea
                    name="message"
                    id="message"
                    rows={4}
                    required
                    className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md"
                    placeholder="Clearly explain the issue..."
                />
            </div>
             <div>
                <label htmlFor="images" className="block text-sm font-medium text-text-secondary mb-1">Upload Evidence (Optional, Max 5MB each)</label>
                <input
                    name="images"
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                />
            </div>
            <SubmitButton />
        </form>
    </div>
  );
}