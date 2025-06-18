// File: app/agent/dashboard/InspectionModal.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { fileInspectionReport } from './actions';
import { useEffect } from 'react';

// The initial state for our form
const initialState = {
  error: null,
  success: false,
};

// A dedicated component for the submission buttons to show a loading state
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

// The main modal component
export default function InspectionModal({ isOpen, onClose, orderId }: { isOpen: boolean; onClose: () => void; orderId: number; }) {
    const [state, formAction] = useFormState(fileInspectionReport, initialState);

    useEffect(() => {
        // If the form submission was successful, close the modal.
        if (state.success) {
            onClose();
        }
    }, [state, onClose]);
    
    // If the modal is not open, render nothing.
    if (!isOpen) return null;

    return (
        // Modal Overlay
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            {/* Modal Content */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">File Inspection Report</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <form action={formAction}>
                    <input type="hidden" name="orderId" value={orderId} />
                    <div className="space-y-4">
                        {/* Report Notes */}
                        <div>
                            <label htmlFor="reportText" className="block text-sm font-medium text-gray-300 mb-1">Inspection Notes</label>
                            <textarea
                                name="reportText"
                                id="reportText"
                                rows={5}
                                placeholder="e.g., Item is in excellent condition, minor scuff on the corner..."
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
                            />
                        </div>
                        {/* Image Uploader */}
                        <div>
                            <label htmlFor="images" className="block text-sm font-medium text-gray-300 mb-1">Upload Photos</label>
                            <input
                                name="images"
                                id="images"
                                type="file"
                                multiple
                                accept="image/*"
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                            />
                        </div>

                        {/* Display any errors from the server action */}
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