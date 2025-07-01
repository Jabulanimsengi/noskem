'use client';

import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { submitInspectionAction } from './actions';
import InspectionForm from './task/[id]/InspectionForm';

interface InspectionModalProps {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function InspectionModal({ orderId, isOpen, onClose }: InspectionModalProps) {
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    try {
      const result = await submitInspectionAction(formData);
      if (result.success) {
        showToast(result.message, 'success');
        onClose();
      }
    } catch (error) {
      const err = error as Error;
      showToast(err.message, 'error');
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* FIX: Changed max-w-2xl to max-w-lg and p-8 to p-6 for a smaller modal */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Submit Inspection Report</h2>
        <InspectionForm
          orderId={orderId}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
        <button
          onClick={onClose}
          className="mt-4 w-full text-center py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}