'use client';

import { useConfirmationModal } from "@/context/ConfirmationModalContext";
import { approvePayoutAction } from "./actions";
import { useToast } from "@/context/ToastContext";
import { useLoading } from "@/context/LoadingContext";

interface PayoutActionsProps {
    orderId: number;
    sellerId: string;
    finalAmount: number;
}

export default function PayoutActions({ orderId, sellerId, finalAmount }: PayoutActionsProps) {
    const { showConfirmation } = useConfirmationModal();
    const { showToast } = useToast();
    const { showLoader, hideLoader } = useLoading();

    const handleApprove = () => {
        showConfirmation({
            title: `Approve Payout for Order #${orderId}`,
            message: "Are you sure you want to approve this payout? This will transfer the funds (as credits) to the seller's account and cannot be undone.",
            confirmText: "Approve Payout",
            onConfirm: async () => {
                showLoader();
                try {
                    await approvePayoutAction(orderId, sellerId, finalAmount);
                    showToast("Payout approved successfully!", 'success');
                } catch (error: any) {
                    showToast(error.message, 'error');
                } finally {
                    hideLoader();
                }
            }
        })
    };

    return (
        <button onClick={handleApprove} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md">
            Approve Payout
        </button>
    );
}