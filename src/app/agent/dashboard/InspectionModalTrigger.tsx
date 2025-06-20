'use client';

import { useState } from 'react';
import InspectionModal from './InspectionModal';

export default function InspectionModalTrigger({ orderId }: { orderId: number }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md whitespace-nowrap"
            >
                File Report
            </button>
            <InspectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                orderId={orderId}
            />
        </>
    );
}