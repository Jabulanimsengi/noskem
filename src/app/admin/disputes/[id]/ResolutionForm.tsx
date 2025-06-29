'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resolveDisputeAction, type ResolutionFormState } from '../actions';
import { useToast } from '@/context/ToastContext';
import { useEffect, useRef } from 'react';

const initialState: ResolutionFormState = {};

function SubmitButton({ text, resolution }: { text: string, resolution: 'refund_buyer' | 'pay_seller' }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            name="resolution"
            value={resolution}
            disabled={pending}
            className={`w-full px-4 py-2 font-bold text-white rounded-md transition-colors disabled:bg-gray-400 ${
                resolution === 'refund_buyer' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
        >
            {pending ? 'Processing...' : text}
        </button>
    );
}

export default function ResolutionForm({ orderId }: { orderId: number }) {
    const [state, formAction] = useFormState(resolveDisputeAction, initialState);
    const { showToast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    useEffect(() => {
        if(state?.error) {
            showToast(state.error, 'error');
        }
        if (state?.success) {
            showToast('The dispute has been resolved successfully.', 'success');
            formRef.current?.reset();
        }
    }, [state, showToast]);
    
    return (
        <form ref={formRef} action={formAction} className="mt-6 border-t pt-6 space-y-4">
            <input type="hidden" name="orderId" value={orderId} />
            <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium mb-1">Resolution Notes</label>
                <textarea
                    name="adminNotes"
                    id="adminNotes"
                    rows={4}
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="Explain the reason for your decision..."
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <SubmitButton text="Refund Buyer" resolution="refund_buyer" />
                <SubmitButton text="Pay Seller" resolution="pay_seller" />
            </div>
        </form>
    );
}