'use client';

import { useTransition } from 'react';
import { useToast } from '@/context/ToastContext';
import { clearAllLikesAction } from '@/app/likes/actions';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';

export default function ClearLikesButton({ hasLikes }: { hasLikes: boolean }) {
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();
    const { showConfirmation } = useConfirmationModal();

    const handleClear = () => {
        showConfirmation({
            title: "Clear All Liked Items",
            message: "Are you sure you want to remove all items from your liked list?",
            confirmText: "Yes, Clear All",
            onConfirm: () => {
                startTransition(async () => {
                    const result = await clearAllLikesAction();
                    if (result.success) {
                        showToast('Your liked items have been cleared.', 'success');
                    } else if (result.error) {
                        showToast(result.error, 'error');
                    }
                });
            }
        });
    };

    if (!hasLikes) {
        return null;
    }

    return (
        <button
            onClick={handleClear}
            disabled={isPending}
            className="text-sm font-semibold text-red-600 hover:underline disabled:text-gray-400"
        >
            {isPending ? 'Clearing...' : 'Clear All'}
        </button>
    );
}