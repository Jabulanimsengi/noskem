// src/app/admin/inspections/ApprovalActions.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/app/components/Button';
import InspectionReportModal from './InspectionReportModal';
import { type InspectionWithDetails } from '@/types';

export default function ApprovalActions({ inspection }: { inspection: InspectionWithDetails }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
          View Report
        </Button>
      </div>
      {isModalOpen && (
        <InspectionReportModal
          inspection={inspection}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}