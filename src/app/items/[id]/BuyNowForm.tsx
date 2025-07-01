// src/app/items/[id]/BuyNowForm.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { useToast } from '@/context/ToastContext';
import { useEffect } from 'react';
import { FaShieldAlt, FaTruck, FaBox } from 'react-icons/fa'; // Import icons

interface FormState {
    // FIX: Changed 'error: string | undefined;' to 'error?: string;'
    // This makes the 'error' property optional, aligning with src/app/items/[id]/actions.ts
    error?: string;
    success?: boolean;
    url?: string;
}

const initialState: FormState = { error: undefined };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            aria-disabled={pending}
            className="w-full bg-brand text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {pending ? 'Processing...' : 'Buy Now'}
        </button>
    );
}

interface BuyNowFormProps {
    itemId: number;
    sellerId: string;
    itemPrice: number;
    itemTitle: string;
    action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}

export default function BuyNowForm({ itemId, sellerId, itemPrice, itemTitle, action }: BuyNowFormProps) {
    const { showToast } = useToast();

    // Use useFormState here if it's intended to manage form state with server actions
    // For this example, assuming action directly handles the state in the server function
    // If useFormState is needed, it would be:
    // const [state, formAction] = useFormState(action, initialState);
    // And then formAction would be passed to the form.

    // For now, assuming direct call of 'action' via onSubmit
    // This component's use of `action` directly in `onSubmit` means `useFormState` might not be directly applied here
    // unless the 'action' itself is a result of useFormState from a parent component.
    // The previous context implies action is a server action that takes FormData.

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        showToast('Processing purchase...', 'info');

        const formData = new FormData(event.currentTarget);
        formData.append('itemId', itemId.toString());
        formData.append('sellerId', sellerId);
        formData.append('itemPrice', itemPrice.toString());
        formData.append('itemTitle', itemTitle);

        const result = await action(initialState, formData); // Pass initialState if action expects it

        if (result?.error) {
            showToast(result.error, 'error');
        } else if (result?.success && result.url) {
            showToast('Redirecting to payment gateway...', 'success');
            window.location.href = result.url;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md space-y-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Complete Your Purchase</h3>
            
            <div className="flex items-center space-x-3 text-text-secondary">
                <FaShieldAlt className="text-brand h-5 w-5" />
                <p className="text-sm">Your payment is secured by our escrow service, ensuring safe transactions.</p>
            </div>
            <div className="flex items-center space-x-3 text-text-secondary">
                <FaTruck className="text-brand h-5 w-5" />
                <p className="text-sm">Includes collection, inspection, and delivery services for a hassle-free experience.</p>
            </div>
            <div className="flex items-center space-x-3 text-text-secondary">
                <FaBox className="text-brand h-5 w-5" />
                <p className="text-sm">Item inspection by a certified agent ensures it matches the description.</p>
            </div>

            <p className="text-3xl font-extrabold text-brand mt-6">R{itemPrice.toFixed(2)}</p>

            <SubmitButton />
        </form>
    );
}