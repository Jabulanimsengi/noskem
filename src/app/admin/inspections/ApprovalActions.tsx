'use client';

import { approveInspection, rejectInspection } from './actions';
import { useLoading } from '@/context/LoadingContext';
import { useToast } from '@/context/ToastContext';

export default function ApprovalActions({ orderId }: { orderId: number }) {
    const { showLoader, hideLoader } = useLoading();
    const { showToast } = useToast();

    const handleApprove = async () => {
        showLoader();
        try {
            await approveInspection(orderId);
            showToast('Inspection approved.', 'success');
        } catch (error) {
            const err = error as Error;
            showToast(err.message, 'error');
        } finally {
            hideLoader();
        }
    };
    
    const handleReject = async () => {
        const reason = prompt("Please provide a reason for rejecting this inspection:");
        if (reason) {
            showLoader();
            try {
                await rejectInspection(orderId, reason);
                showToast('Inspection rejected and order cancelled.', 'info');
            } catch (error) {
                const err = error as Error;
                showToast(err.message, 'error');
            } finally {
                hideLoader();
            }
        }
    };

    return (
        <div className="flex gap-2">
            <button onClick={handleReject} className="px-3 py-1 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md">
                Reject
            </button>
            <button onClick={handleApprove} className="px-3 py-1 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md">
                Approve
            </button>
        </div>
    );
}