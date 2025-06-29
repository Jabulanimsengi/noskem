'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitVerificationAction, type VerificationFormState } from './actions';
import { useToast } from '@/context/ToastContext';

const initialState: VerificationFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400"
    >
      {pending ? 'Submitting...' : 'Submit for Verification'}
    </button>
  );
}

export default function VerificationForm() {
  const [state, formAction] = useFormState(submitVerificationAction, initialState);
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) {
      showToast(state.error, 'error');
    }
    if (state.success) {
      showToast('Your documents have been submitted for review!', 'success');
      formRef.current?.reset();
    }
  }, [state, showToast]);
  
  const inputStyles = "w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text-primary mb-2">Become a Verified Seller</h2>
      <p className="text-text-secondary mb-6">Upload a copy of your ID document and a proof of address (e.g., utility bill, bank statement) to get a "Verified" badge on your profile.</p>
      
      <form ref={formRef} action={formAction} className="space-y-6">
        <div>
          <label htmlFor="idDocument" className={labelStyles}>ID Document (Max 5MB)</label>
          <input type="file" name="idDocument" id="idDocument" required accept="image/*,.pdf" className={inputStyles} />
        </div>

        <div>
          <label htmlFor="proofOfAddress" className={labelStyles}>Proof of Address (Max 5MB)</label>
          <input type="file" name="proofOfAddress" id="proofOfAddress" required accept="image/*,.pdf" className={inputStyles} />
        </div>
        
        {state.error && <div className="p-3 text-center text-white bg-red-500 rounded-md text-sm">{state.error}</div>}
        
        <div className="pt-2">
            <SubmitButton />
        </div>
      </form>
    </div>
  );
}