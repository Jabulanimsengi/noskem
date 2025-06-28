'use client';

import { useTransition } from 'react';
import { useToast } from '@/context/ToastContext';
import { confirmCollectionAction } from './actions';

export default function ConfirmCollectionButton({ orderId }: { orderId: number }) {
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    const handleConfirm = () => {
        startTransition(async () => {
            try {
                await confirmCollectionAction(orderId);
                showToast('Collection confirmed!', 'success');
            } catch (error) {
                const err = error as Error;
                showToast(err.message, 'error');
            }
        });
    };

    return (
        <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
            {isPending ? 'Confirming...' : 'Confirm Collection'}
        </button>
    );
}