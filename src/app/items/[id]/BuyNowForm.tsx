// src/app/items/[id]/BuyNowForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useToast } from '@/context/ToastContext';
import { useEffect } from 'react';
import { FaShieldAlt, FaTruck, FaBox } from 'react-icons/fa';
import { type FormState } from './actions'; // Ensure this import is correct

const initialState: FormState = {
    error: undefined,
    success: false,
    url: undefined,
};

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
    addDelivery: boolean; // Keep this prop to pass the delivery choice
    action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}

export default function BuyNowForm({ itemId, sellerId, itemPrice, itemTitle, addDelivery, action }: BuyNowFormProps) {
    const { showToast } = useToast();
    // --- FIX: Correctly use the useFormState hook ---
    const [state, formAction] = useFormState(action, initialState);
    
    const deliveryFee = 399;
    const totalPrice = addDelivery ? itemPrice + deliveryFee : itemPrice;

    // This effect will run when the server action returns a response
    useEffect(() => {
        if (state.success && state.url) {
            showToast('Redirecting to payment gateway...', 'success');
            window.location.href = state.url;
        }
        if (state.error) {
            showToast(state.error, 'error');
        }
    }, [state, showToast]);

    return (
        // --- FIX: The form now calls 'formAction' directly ---
        <form action={formAction} className="p-6 bg-white rounded-lg shadow-md space-y-6">
            {/* Hidden inputs to pass all necessary data to the server action */}
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="sellerId" value={sellerId} />
            <input type="hidden" name="itemPrice" value={itemPrice} />
            <input type="hidden" name="itemTitle" value={itemTitle} />
            <input type="hidden" name="addDelivery" value={String(addDelivery)} />

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

            <p className="text-3xl font-extrabold text-brand mt-6">R{totalPrice.toFixed(2)}</p>

            <SubmitButton />
        </form>
    );
}
