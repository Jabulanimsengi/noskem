'use client';

import { useTransition } from 'react';
import { approveVerificationAction, rejectVerificationAction } from './actions';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';

export default function VerificationActions({ userId }: { userId: string }) {
    const { showToast } = useToast();
    const { showLoader, hideLoader } = useLoading();

    const handleApprove = () => {
        showLoader();
        startTransition(async () => {
            try {
                await approveVerificationAction(userId);
                showToast('User has been verified.', 'success');
            } catch (error) {
                showToast((error as Error).message, 'error');
            } finally {
                hideLoader();
            }
        });
    };

    const handleReject = () => {
        const reason = prompt("Please provide a reason for rejecting this verification:");
        if (reason) {
            showLoader();
            startTransition(async () => {
                try {
                    await rejectVerificationAction(userId, reason);
                    showToast('User verification rejected.', 'info');
                } catch (error) {
                    showToast((error as Error).message, 'error');
                } finally {
                    hideLoader();
                }
            });
        }
    };

    const [isPending, startTransition] = useTransition();

    return (
        <div className="flex gap-2">
            <button onClick={handleReject} disabled={isPending} className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                Reject
            </button>
            <button onClick={handleApprove} disabled={isPending} className="px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                Approve
            </button>
        </div>
    );
}