'use client';

// FIX: Import 'useActionState' from 'react' instead of 'useFormState' from 'react-dom'
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { adjustCreditsAction } from './actions';
import { useEffect } from 'react';
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
    
    // FIX: The hook has been renamed from 'useFormState' to 'useActionState'
    const [state, formAction] = useActionState(adjustCreditsAction, { error: null, success: false, message: '' });

    useEffect(() => {
        if (state?.error) {
            showToast(state.error, 'error');
        }
        // Optional: Show a success message if the action provides one
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