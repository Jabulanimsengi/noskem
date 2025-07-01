'use client';

import { useTransition } from 'react';
import { acceptTaskAction } from './actions'; // FIX: Corrected the imported function name
import { useToast } from '@/context/ToastContext';

export default function AcceptTaskButton({ orderId }: { orderId: number }) {
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    const handleAccept = () => {
        startTransition(async () => {
            try {
                // FIX: Call the correct function
                await acceptTaskAction(orderId);
                showToast('Task accepted successfully!', 'success');
            } catch (error) {
                const err = error as Error;
                showToast(err.message, 'error');
            }
        });
    };

    return (
        <button
            onClick={handleAccept}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
            {isPending ? 'Accepting...' : 'Accept Task'}
        </button>
    );
}