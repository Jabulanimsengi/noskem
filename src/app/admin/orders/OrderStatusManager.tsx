'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateOrderStatusByAdmin } from './actions';
import { useToast } from '@/context/ToastContext';
import { type OrderStatus } from '@/types';

const statusOptions: OrderStatus[] = [
    'pending_payment', 'payment_authorized', 'awaiting_assessment', 
    'pending_admin_approval', 'awaiting_collection', 'in_warehouse', 
    'out_for_delivery', 'delivered', 'completed', 'cancelled', 'disputed', 'funds_paid_out'
];

interface OrderStatusManagerProps {
    orderId: number;
    currentStatus: OrderStatus;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="px-4 py-2 font-semibold text-white bg-brand rounded-md hover:bg-brand-dark disabled:bg-gray-400">
            {pending ? 'Saving...' : 'Save Status'}
        </button>
    );
}

export default function OrderStatusManager({ orderId, currentStatus }: OrderStatusManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
    const { showToast } = useToast();

    const handleFormAction = async (formData: FormData) => {
        const result = await updateOrderStatusByAdmin(formData);
        if (result.success) {
            showToast('Order status updated successfully!', 'success');
            setIsModalOpen(false);
        } else {
            showToast(result.error || 'Failed to update status.', 'error');
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-md"
            >
                Update Status
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Update Order #{orderId}</h2>
                        <form action={handleFormAction} className="space-y-4">
                            <input type="hidden" name="orderId" value={orderId} />
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium mb-1">New Status</label>
                                <select 
                                    name="newStatus"
                                    id="status"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    {statusOptions.map(status => (
                                        <option key={status} value={status}>{status.replace(/_/g, ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                <textarea 
                                    name="notes"
                                    id="notes"
                                    rows={3}
                                    placeholder="e.g., Courier tracking number: XYZ123"
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                                <SubmitButton />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}