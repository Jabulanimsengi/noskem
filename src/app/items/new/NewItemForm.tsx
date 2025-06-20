'use client';

import { useState, useEffect, useCallback, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { listItemAction, type ListItemFormState } from './actions';
import { FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { type Category } from '@/types';

const MapSelector = dynamic(() => import('./MapSelector'), { 
  ssr: false,
  loading: () => <div className="h-72 bg-gray-200 rounded-lg flex items-center justify-center"><p>Loading Map...</p></div>
});

const initialState: ListItemFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400">
      {pending ? 'Processing...' : 'List Item (Cost: 25 Credits)'}
    </button>
  );
}

export default function NewItemForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [state, formAction] = useActionState(listItemAction, initialState);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // --- FIX #1: Initialize location with null values for safety ---
  const [location, setLocation] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
  const MAX_IMAGES = 5;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const remainingSlots = MAX_IMAGES - images.length;
      const filesToAdd = newFiles.slice(0, remainingSlots);
      setImages(prev => [...prev, ...filesToAdd]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng });
  }, []);

  useEffect(() => {
    const newPreviews = images.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
    return () => { newPreviews.forEach(url => URL.revokeObjectURL(url)); };
  }, [images]);

  useEffect(() => {
    if (state.success) {
      alert('Your item has been listed successfully!');
      router.push('/');
    }
  }, [state.success, router]);

  const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <form action={formAction} className="p-8 bg-surface rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-text-primary">List a New Item</h1>
        
        {/* Form fields */}
        <div>
          <label htmlFor="title" className={labelStyles}>Title</label>
          <input name="title" id="title" type="text" required className={inputStyles}/>
        </div>
        <div>
            <label htmlFor="description" className={labelStyles}>Description</label>
            <textarea name="description" id="description" rows={4} className={inputStyles}/>
        </div>
        <div>
            <label htmlFor="price" className={labelStyles}>Price (R)</label>
            <input name="price" id="price" type="number" step="0.01" required className={inputStyles}/>
        </div>
        <div>
          <label htmlFor="categoryId" className={labelStyles}>Category</label>
          <select name="categoryId" id="categoryId" required className={inputStyles} defaultValue="">
            <option value="" disabled>Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className={labelStyles}>Condition</label>
          <select name="condition" id="condition" required defaultValue="used_good" className={inputStyles}>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="used_good">Used (Good)</option>
            <option value="used_fair">Used (Fair)</option>
          </select>
        </div>

        {/* Geolocation Section */}
        <div>
          <label className={labelStyles}>Set Item Location</label>
          <p className="text-xs text-gray-500 mb-2">Click on the map or drag the pin to set the location.</p>
          <MapSelector onLocationSelect={handleLocationSelect} />
          {/* --- FIX #2: Use nullish coalescing operator (??) to provide a fallback --- */}
          <input type="hidden" name="latitude" value={location.lat ?? ''} />
          <input type="hidden" name="longitude" value={location.lng ?? ''} />
        </div>

        {/* Image Uploader Section */}
        <div>
          <label htmlFor="images" className={labelStyles}>Images ({images.length}/{MAX_IMAGES})</label>
          <input name="images" id="images" type="file" multiple accept="image/*" onChange={handleImageChange} disabled={images.length >= MAX_IMAGES} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 disabled:opacity-50"/>
        </div>
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {imagePreviews.map((previewUrl, index) => (
              <div key={index} className="relative aspect-square">
                <Image src={previewUrl} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover"/>
                <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                  <FaTimes size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {state.error && <div className="p-3 text-center text-white bg-red-500 rounded-md">{state.error}</div>}
        <SubmitButton />
      </form>
    </div>
  );
}