// src/app/admin/inspections/InspectionReportModal.tsx
'use client';

import { useTransition } from 'react';
import { approveInspection, rejectInspection } from './actions';
import { Button } from '@/app/components/Button';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';
import { type InspectionWithDetails } from '@/types';

interface ModalProps {
  inspection: InspectionWithDetails;
  onClose: () => void;
}

export default function InspectionReportModal({ inspection, onClose }: ModalProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleDecision = (decision: 'approved' | 'rejected') => {
    startTransition(async () => {
      try {
        if (decision === 'approved') {
          await approveInspection(inspection.id, inspection.order_id);
        } else {
          await rejectInspection(inspection.id, inspection.order_id);
        }
        showToast(`Report has been ${decision}.`, 'success');
        onClose();
      } catch (error) {
        const err = error as Error;
        showToast(err.message, 'error');
      }
    });
  };

  const renderCheck = (matches: boolean | null) => (
    <span className={matches ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
      {matches ? 'Yes' : 'No'}
    </span>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Inspection Report for Order #{inspection.order_id}</h2>
          <p className="text-sm text-gray-500">Item: {inspection.orders?.items?.title || 'N/A'}</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-2">Agent's Verdict: <span className={inspection.final_verdict === 'approved' ? 'text-green-600' : 'text-red-600'}>{inspection.final_verdict}</span></h3>
            <p className="bg-gray-50 p-3 rounded-md border">{inspection.verdict_notes}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold">Condition</h4>
              <p>Matches Description? {renderCheck(inspection.condition_matches)}</p>
              {inspection.condition_notes && <p className="text-sm text-gray-600 mt-1">Notes: {inspection.condition_notes}</p>}
            </div>
            <div>
              <h4 className="font-semibold">Functionality</h4>
              <p>Works as Expected? {renderCheck(inspection.functionality_matches)}</p>
              {inspection.functionality_notes && <p className="text-sm text-gray-600 mt-1">Notes: {inspection.functionality_notes}</p>}
            </div>
            <div>
              <h4 className="font-semibold">Accessories</h4>
              <p>All Included? {renderCheck(inspection.accessories_matches)}</p>
              {inspection.accessories_notes && <p className="text-sm text-gray-600 mt-1">Notes: {inspection.accessories_notes}</p>}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Agent's Photos</h4>
            {inspection.photos && inspection.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {inspection.photos?.map((photo: string, index: number) => (
                  <a key={index} href={photo} target="_blank" rel="noopener noreferrer">
                    <Image src={photo} alt={`Inspection photo ${index + 1}`} width={200} height={200} className="rounded-md object-cover aspect-square" />
                  </a>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500">No photos were submitted.</p>}
          </div>
        </div>
        <div className="p-6 bg-gray-50 border-t flex justify-end gap-4 sticky bottom-0">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={() => handleDecision('rejected')} disabled={isPending}>Reject</Button>
          <Button onClick={() => handleDecision('approved')} disabled={isPending}>
            {isPending ? 'Processing...' : 'Approve'}
          </Button>
        </div>
      </div>
    </div>
  );
}