// src/app/admin/verifications/VerificationActions.tsx
'use client';

import { useTransition } from 'react';
import { approveVerificationAction, rejectVerificationAction } from './actions';
import { useToast } from '@/context/ToastContext';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';

interface VerificationActionsProps {
  profileId: string;
}

export default function VerificationActions({ profileId }: VerificationActionsProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const { showConfirmation } = useConfirmationModal();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveVerificationAction(profileId);
      showToast(result.message, result.success ? 'success' : 'error');
    });
  };

  const handleReject = () => {
    showConfirmation({
      title: 'Reject Verification',
      message: 'Please provide a reason for rejecting this verification. This will be sent to the user.',
      confirmText: 'Reject',
      requiresInput: true,
      onConfirm: (reason) => {
        if (!reason) {
          showToast('A reason for rejection is required.', 'error');
          return;
        }
        startTransition(async () => {
          const result = await rejectVerificationAction(profileId, reason);
          showToast(result.message, result.success ? 'success' : 'error');
        });
      },
    });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
      >
        {isPending ? '...' : 'Approve'}
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
      >
        {isPending ? '...' : 'Reject'}
      </button>
    </div>
  );
}