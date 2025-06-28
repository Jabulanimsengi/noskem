'use client';

// FIX: Import hooks from 'react' and 'react-dom' correctly.
import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createCheckoutSession, type FormState } from './actions';
import { INSPECTION_FEE, COLLECTION_FEE, DELIVERY_FEE } from '@/lib/constants';
import { FaShieldAlt, FaTruck, FaBox } from 'react-icons/fa';

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-6 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400"
    >
      {pending ? 'Processing...' : 'Proceed to Payment'}
    </button>
  );
}

export default function BuyNowForm({
  itemId,
  sellerId,
  itemPrice,
}: {
  itemId: number;
  sellerId: string;
  itemPrice: number;
}) {
  // FIX: The hook is correctly named useFormState.
  const [state, formAction] = useFormState(createCheckoutSession, initialState);

  const [includeInspection, setIncludeInspection] = useState(false);
  const [includeCollection, setIncludeCollection] = useState(false);
  const [includeDelivery, setIncludeDelivery] = useState(false);

  const totalAmount = useMemo(() => {
    let total = itemPrice || 0;
    if (includeInspection) total += INSPECTION_FEE;
    if (includeCollection) total += COLLECTION_FEE;
    if (includeDelivery) total += DELIVERY_FEE;
    return total;
  }, [itemPrice, includeInspection, includeCollection, includeDelivery]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="sellerId" value={sellerId} />
      <input type="hidden" name="itemPrice" value={itemPrice} />
      <input type="hidden" name="includeInspection" value={String(includeInspection)} />
      <input type="hidden" name="includeCollection" value={String(includeCollection)} />
      <input type="hidden" name="includeDelivery" value={String(includeDelivery)} />

      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-text-primary">
            <FaShieldAlt className="text-gray-400" /> Item Inspection
          </span>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">+ R{INSPECTION_FEE.toFixed(2)}</span>
            <input type="checkbox" checked={includeInspection} onChange={(e) => setIncludeInspection(e.target.checked)} className="h-5 w-5 rounded text-brand focus:ring-brand" />
          </div>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-text-primary">
            <FaBox className="text-gray-400" /> Agent Collection
          </span>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">+ R{COLLECTION_FEE.toFixed(2)}</span>
            <input type="checkbox" checked={includeCollection} onChange={(e) => setIncludeCollection(e.target.checked)} className="h-5 w-5 rounded text-brand focus:ring-brand" />
          </div>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-text-primary">
            <FaTruck className="text-gray-400" /> Delivery to You
          </span>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">+ R{DELIVERY_FEE.toFixed(2)}</span>
            <input type="checkbox" checked={includeDelivery} onChange={(e) => setIncludeDelivery(e.target.checked)} className="h-5 w-5 rounded text-brand focus:ring-brand" />
          </div>
        </label>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <span className="text-lg font-bold text-text-primary">Total Amount:</span>
        <span className="text-2xl font-bold text-brand">R{totalAmount.toFixed(2)}</span>
      </div>

      {state?.error && (
        <p className="p-3 text-center text-sm text-white bg-red-500 rounded-md">
          {state.error}
        </p>
      )}
      
      <SubmitButton />
    </form>
  );
}
