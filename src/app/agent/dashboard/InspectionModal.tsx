'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { fileInspectionReport } from './actions'; 
import { useEffect } from 'react';

const initialState = {
  error: null,
  success: false,
};

// --- FIX: The full implementation of this component is now included. ---
function SubmitButtons() {
    const { pending } = useFormStatus();
    return (
        <div className="flex justify-end gap-4 mt-6">
            <button
                type="submit"
                name="inspectionResult"
                value="failed"
                disabled={pending}
                className="px-6 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-500"
            >
                {pending ? 'Submitting...' : 'Fail Inspection'}
            </button>
            <button
                type="submit"
                name="inspectionResult"
                value="passed"
                disabled={pending}
                className="px-6 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500"
            >
                {pending ? 'Submitting...' : 'Pass Inspection'}
            </button>
        </div>
    );
}

export default function InspectionModal({ isOpen, onClose, orderId }: { isOpen: boolean; onClose: () => void; orderId: number; }) {
    const [state, formAction] = useActionState(fileInspectionReport, initialState);

    useEffect(() => {
        if (state.success) {
            onClose();
        }
    }, [state, onClose]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-text-primary">File Inspection Report for Order #{orderId}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                
                <form action={formAction}>
                    <input type="hidden" name="orderId" value={orderId} />
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="reportText" className="block text-sm font-medium text-text-secondary mb-1">Inspection Notes</label>
                            <textarea
                                name="reportText"
                                id="reportText"
                                rows={5}
                                placeholder="e.g., Item is in excellent condition, minor scuff on the corner..."
                                className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label htmlFor="images" className="block text-sm font-medium text-text-secondary mb-1">Upload Photos</label>
                            <input
                                name="images"
                                id="images"
                                type="file"
                                multiple
                                accept="image/*"
                                className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                            />
                        </div>

                        {state?.error && (
                            <p className="p-3 text-center text-sm text-white bg-red-500 rounded-md">
                                {state.error}
                            </p>
                        )}
                        <SubmitButtons />
                    </div>
                </form>
            </div>
        </div>
    );
}