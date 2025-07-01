'use client';

import { useFormStatus } from 'react-dom';

// FIX: Define the props the component will receive
interface InspectionFormProps {
  orderId: number;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400"
    >
      {pending ? 'Submitting...' : 'Submit Report'}
    </button>
  );
}

// FIX: Update the component to use the defined props
export default function InspectionForm({ orderId, isPending, onSubmit }: InspectionFormProps) {
  // The component now correctly uses the passed-down onSubmit handler
  return (
    <form action={onSubmit} className="space-y-6">
      <input type="hidden" name="orderId" value={orderId} />

      <fieldset className="space-y-2 border p-4 rounded-md">
        <legend className="text-lg font-semibold px-2">Item Condition</legend>
        <div className="flex items-center gap-4">
          <label><input type="radio" name="conditionMatches" value="yes" required /> Matches Description</label>
          <label><input type="radio" name="conditionMatches" value="no" /> Does Not Match</label>
        </div>
        <textarea name="conditionNotes" placeholder="Optional notes on condition..." className="w-full p-2 border rounded-md" rows={2}></textarea>
      </fieldset>

      <fieldset className="space-y-2 border p-4 rounded-md">
        <legend className="text-lg font-semibold px-2">Functionality</legend>
        <div className="flex items-center gap-4">
          <label><input type="radio" name="functionalityMatches" value="yes" required /> Works as Expected</label>
          <label><input type="radio" name="functionalityMatches" value="no" /> Has Issues</label>
        </div>
        <textarea name="functionalityNotes" placeholder="Optional notes on functionality..." className="w-full p-2 border rounded-md" rows={2}></textarea>
      </fieldset>

      <fieldset className="space-y-2 border p-4 rounded-md">
        <legend className="text-lg font-semibold px-2">Accessories</legend>
        <div className="flex items-center gap-4">
          <label><input type="radio" name="accessoriesMatches" value="yes" required /> All Included</label>
          <label><input type="radio" name="accessoriesMatches" value="no" /> Some Missing</label>
        </div>
        <textarea name="accessoriesNotes" placeholder="Optional notes on accessories..." className="w-full p-2 border rounded-md" rows={2}></textarea>
      </fieldset>

      <fieldset className="space-y-2 border p-4 rounded-md bg-gray-50">
        <legend className="text-lg font-semibold px-2">Final Verdict</legend>
        <div className="flex items-center gap-4">
          <label className="font-bold text-green-700"><input type="radio" name="finalVerdict" value="approved" required /> Approve</label>
          <label className="font-bold text-red-700"><input type="radio" name="finalVerdict" value="rejected" /> Reject</label>
        </div>
        <textarea name="verdictNotes" placeholder="Required summary for your final verdict..." className="w-full p-2 border rounded-md" rows={3} required></textarea>
      </fieldset>

      {/* The form now uses its own internal SubmitButton */}
      <SubmitButton />
    </form>
  );
}