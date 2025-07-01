'use client';

import { useTransition } from 'react';
import { approveInspection, rejectInspection } from './actions';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';

interface ApprovalActionsProps {
  inspectionId: number;
  orderId: number;
}

export default function ApprovalActions({ inspectionId, orderId }: ApprovalActionsProps) {
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();
    const { showLoader, hideLoader } = useLoading();
    // FIX: Changed from 'openModal' to 'showConfirmation'
    const { showConfirmation } = useConfirmationModal();

    const handleApprove = async () => {
        showLoader();
        startTransition(async () => {
            try {
                // FIX: Pass the correct number of arguments
                await approveInspection(inspectionId, orderId);
                showToast('Inspection approved.', 'success');
            } catch (error) {
                const err = error as Error;
                showToast(err.message, 'error');
            } finally {
                hideLoader();
            }
        });
    };

    const handleReject = () => {
        // FIX: Call 'showConfirmation' with a single object argument
        showConfirmation({
            title: 'Confirm Rejection',
            message: 'Are you sure you want to reject this inspection? This will cancel the order and notify all parties.',
            onConfirm: async () => {
                showLoader();
                startTransition(async () => {
                    try {
                        // FIX: Pass the correct number of arguments
                        await rejectInspection(inspectionId, orderId);
                        showToast('Inspection rejected and order cancelled.', 'success');
                    } catch (error) {
                        const err = error as Error;
                        showToast(err.message, 'error');
                    } finally {
                        hideLoader();
                    }
                });
            },
        });
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleApprove}
                disabled={isPending}
                className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
                Approve
            </button>
            <button
                onClick={handleReject}
                disabled={isPending}
                className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
            >
                Reject
            </button>
        </div>
    );
}