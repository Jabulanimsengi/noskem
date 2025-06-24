'use client';

import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import { useToast } from '@/context/ToastContext';
import { toggleUserBanAction, deleteUserAction } from './actions';
import { FaUserSlash, FaTrash, FaUserCheck } from 'react-icons/fa';

interface UserActionsProps {
  userId: string;
  isBanned: boolean;
}

export default function UserActions({ userId, isBanned }: UserActionsProps) {
  const { showConfirmation } = useConfirmationModal();
  const { showToast } = useToast();

  const handleToggleBan = () => {
    showConfirmation({
      title: isBanned ? 'Un-suspend User' : 'Suspend User',
      message: `Are you sure you want to ${isBanned ? 'un-suspend' : 'suspend'} this user? They will ${isBanned ? 'regain' : 'lose'} access to their account immediately.`,
      onConfirm: async () => {
        const result = await toggleUserBanAction(userId, isBanned);
        if (result.success) {
          showToast(result.message || 'Action successful!', 'success');
        } else if (result.error) {
          showToast(result.error, 'error');
        }
      },
    });
  };

  const handleDelete = () => {
    showConfirmation({
      title: 'Delete User',
      message: 'DANGER: Are you sure you want to permanently delete this user? This will remove all their associated data and cannot be undone.',
      confirmText: 'Yes, Delete User',
      onConfirm: async () => {
        const result = await deleteUserAction(userId);
        if (result.success) {
          showToast(result.message || 'User deleted.', 'success');
        } else if (result.error) {
          showToast(result.error, 'error');
        }
      },
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleToggleBan}
        title={isBanned ? 'Un-suspend User' : 'Suspend User'}
        className={`p-2 rounded-full transition-colors ${
          isBanned 
            ? 'text-green-600 hover:bg-green-100'
            : 'text-yellow-600 hover:bg-yellow-100'
        }`}
      >
        {isBanned ? <FaUserCheck size={16} /> : <FaUserSlash size={16} />}
      </button>
      <button
        onClick={handleDelete}
        title="Delete User"
        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
      >
        <FaTrash size={14} />
      </button>
    </div>
  );
}