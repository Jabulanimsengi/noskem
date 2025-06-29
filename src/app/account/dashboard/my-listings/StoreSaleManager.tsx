'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { setStoreSaleAction } from './actions';
import { useToast } from '@/context/ToastContext';
import { useEffect, useRef } from 'react';

// This initial state now perfectly matches the possible return values of the action.
const initialState: {
    error?: string;
    success?: boolean;
    message?: string;
} = {
    success: false,
    message: '',
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
        >
            {pending ? 'Starting Sale...' : 'Start Sale'}
        </button>
    );
}

export default function StoreSaleManager() {
    const [state, formAction] = useFormState(setStoreSaleAction, initialState);
    const { showToast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            showToast(state.message || 'Success!', 'success');
            formRef.current?.reset(); // Clear form on success
        } else if (state.error) {
            showToast(state.error, 'error');
        }
    }, [state, showToast]);


    return (
        <div className="p-6 bg-white rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Create a Store-Wide Sale</h2>
            <p className="text-gray-600 mb-4">Apply a discount to all of your active listings for a limited time.</p>
            <form ref={formRef} action={formAction} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 space-y-4 sm:space-y-0">
                    <div className="flex-1">
                        <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                            Discount Percentage
                        </label>
                        <div className="relative mt-1">
                             <input
                                type="number"
                                id="discount"
                                name="discount"
                                required
                                min="5"
                                max="90"
                                className="w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                placeholder="e.g., 20"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">%</span>
                            </div>
                        </div>

                    </div>
                    <div className="flex-1">
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                           Sale Duration
                        </label>
                         <select
                            id="duration"
                            name="duration"
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        >
                            <option value="">Select duration...</option>
                            <option value="3">3 Days</option>
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                        </select>
                    </div>
                    <div className="flex-shrink-0">
                        <SubmitButton />
                    </div>
                </div>
                 {state?.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}
            </form>
        </div>
    );
}