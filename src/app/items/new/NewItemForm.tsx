// File: app/items/new/NewItemForm.tsx

'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { listItemAction, type ListItemFormState } from './actions';

// The initial state for our form
const initialState: ListItemFormState = {
  error: null,
  success: false,
};

// A dedicated button component to show loading state
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
    >
      {pending ? 'Processing...' : 'List Item (Cost: 25 Credits)'}
    </button>
  );
}

export default function NewItemForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(listItemAction, initialState);

  // Redirect the user to the homepage on successful listing
  useEffect(() => {
    if (state.success) {
      alert('Your item has been listed successfully!');
      router.push('/');
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="p-8 bg-gray-800 rounded-lg space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
        <input name="title" id="title" type="text" required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea name="description" id="description" rows={4} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price (R)</label>
        <input name="price" id="price" type="number" step="0.01" required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>

      {/* Condition */}
      <div>
        <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">Condition</label>
        <select name="condition" id="condition" required defaultValue="used_good" className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="new">New</option>
          <option value="like_new">Like New</option>
          <option value="used_good">Used (Good)</option>
          <option value="used_fair">Used (Fair)</option>
        </select>
      </div>

      {/* Image Uploader */}
      <div>
        <label htmlFor="images" className="block text-sm font-medium text-gray-300 mb-1">Images</label>
        <input name="images" id="images" type="file" multiple required accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"/>
      </div>

      {/* Error Message Display */}
      {state.error && (
        <div className="p-3 text-center text-white bg-red-500 rounded-md">
            {state.error}
        </div>
      )}

      {/* Submit Button */}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}