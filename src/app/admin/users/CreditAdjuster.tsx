'use client';

// FIX: Import 'useEffect' from 'react' and 'useFormState' from 'react-dom'.
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { adjustCreditsAction } from './actions';
import { useToast } from '@/context/ToastContext';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="px-3 py-1 text-sm font-semibold text-white bg-brand rounded-md hover:bg-brand-dark disabled:bg-gray-400">
            {pending ? '...' : 'Adjust'}
        </button>
    );
}

export default function CreditAdjuster({ userId }: { userId: string }) {
    const { showToast } = useToast();
    
    // FIX: The hook is correctly named useFormState.
    const [state, formAction] = useFormState(adjustCreditsAction, { error: null, success: false, message: '' });

    useEffect(() => {
        if (state?.error) {
            showToast(state.error, 'error');
        }
        if (state?.success && state.message) {
            showToast(state.message, 'success');
        }
    }, [state, showToast]);

    return (
        <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={userId} />
            <input 
                type="number" 
                name="amount" 
                placeholder="Amount"
                className="w-20 px-2 py-1 text-sm border-gray-300 rounded-md"
                required
            />
            <input 
                type="text" 
                name="notes" 
                placeholder="Reason (e.g., Refund Order #123)"
                className="flex-grow px-2 py-1 text-sm border-gray-300 rounded-md"
                required
            />
            <SubmitButton />
        </form>
    );
}
