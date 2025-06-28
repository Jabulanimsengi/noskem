'use client';

// FIX: Import 'useEffect' from 'react' and 'useFormState' from 'react-dom'.
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateItemAction, type UpdateItemFormState } from './actions';
import { type Item, type Category } from '@/types';
import { useToast } from '@/context/ToastContext';

const initialState: UpdateItemFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400">
      {pending ? 'Saving Changes...' : 'Save Changes'}
    </button>
  );
}

interface EditItemFormProps {
  item: Item;
  categories: Category[];
}

export default function EditItemForm({ item, categories }: EditItemFormProps) {
  // FIX: The hook is correctly named useFormState.
  const [state, formAction] = useFormState(updateItemAction, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, 'error');
    }
  }, [state, showToast]);

  const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <form action={formAction} className="p-8 bg-surface rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-text-primary">Edit Your Listing</h1>
        <input type="hidden" name="itemId" value={item.id} />
        
        <div>
          <label htmlFor="title" className={labelStyles}>Title</label>
          <input name="title" id="title" type="text" required className={inputStyles} defaultValue={item.title}/>
        </div>
        <div>
            <label htmlFor="description" className={labelStyles}>Description</label>
            <textarea name="description" id="description" rows={4} className={inputStyles} defaultValue={item.description || ''}/>
        </div>
        <div>
            <label htmlFor="price" className={labelStyles}>Price (R)</label>
            <input name="price" id="price" type="number" step="0.01" required className={inputStyles} defaultValue={item.buy_now_price || ''}/>
        </div>
        <div>
          <label htmlFor="categoryId" className={labelStyles}>Category</label>
          <select name="categoryId" id="categoryId" required className={inputStyles} defaultValue={item.category_id || ''}>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className={labelStyles}>Condition</label>
          <select name="condition" id="condition" required className={inputStyles} defaultValue={item.condition}>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="used_good">Used (Good)</option>
            <option value="used_fair">Used (Fair)</option>
          </select>
        </div>

        {state.error && <div className="p-3 text-center text-white bg-red-500 rounded-md">{state.error}</div>}
        <SubmitButton />
      </form>
    </div>
  );
}
