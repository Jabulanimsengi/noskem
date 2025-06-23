'use client';

import { useState, useEffect, useCallback, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import dynamic from 'next/dynamic';
import { listItemAction, type ListItemFormState } from './actions';
import { FaTimes, FaSpinner, FaMapMarkerAlt } from 'react-icons/fa';
import Image from 'next/image';
import { type Category } from '@/types';
import { useToast } from '@/context/ToastContext';
import { createClient } from '@/app/utils/supabase/client';

const MapSelector = dynamic(() => import('./MapSelector'), { 
  ssr: false,
  loading: () => <div className="h-72 bg-gray-200 rounded-lg flex items-center justify-center"><p>Loading Map...</p></div>
});

const initialState: ListItemFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400 flex items-center justify-center gap-2">
      {pending && <FaSpinner className="animate-spin" />}
      {pending ? 'Processing...' : 'List Item (Cost: 25 Credits)'}
    </button>
  );
}

export default function NewItemForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [state, formAction] = useActionState(listItemAction, initialState);
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const MAX_IMAGES = 5;

  useEffect(() => {
    if (state.success) {
      showToast('Your item has been listed successfully!', 'success');
      router.push('/account/dashboard/my-listings');
    }
    if (state.error) {
      showToast(state.error, 'error');
    }
  }, [state, router, showToast]);

  // FIX: This function is now a standard event handler for onSubmit.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // Prevent the browser's default form submission
    event.preventDefault();

    if (images.length === 0) {
      showToast('Please upload at least one image.', 'error');
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('You must be logged in.', 'error');
      return;
    }
    
    showToast('Uploading images...', 'info');
    
    try {
      const uploadPromises = images.map(file => {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        return supabase.storage.from('item-images').upload(filePath, file);
      });
      const uploadResults = await Promise.all(uploadPromises);

      const uploadedImageUrls: string[] = [];
      for (const result of uploadResults) {
        if (result.error) throw new Error(`Image upload failed: ${result.error.message}`);
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(result.data.path);
        uploadedImageUrls.push(publicUrl);
      }
      
      // Manually create a FormData object from the form
      const formData = new FormData(event.currentTarget);
      uploadedImageUrls.forEach(url => formData.append('imageUrls', url));
      
      // Manually call the server action. This is now the correct pattern.
      formAction(formData);

    } catch (error: any) {
      showToast(error.message || "An unexpected error occurred during image upload.", 'error');
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.size <= 10 * 1024 * 1024);
      if (Array.from(e.target.files).length > newFiles.length) {
        showToast(`Some images were too large (max 10MB) and were not added.`, 'error');
      }
      setImages(prev => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng });
  }, []);
  
  const detectMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        showToast('Location detected!', 'success');
      },
      () => showToast('Could not detect location.', 'error')
    );
  };
  
  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => { urls.forEach(URL.revokeObjectURL); };
  }, [images]);

  const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div className="container mx-auto max-w-2xl py-8">
      {/* FIX: The form now uses onSubmit instead of the action prop. */}
      <form onSubmit={handleSubmit} className="p-8 bg-surface rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-text-primary">List a New Item</h1>
        
        {/* The SubmitButton component is now inside the form and will trigger the onSubmit handler */}
        <div className="pt-2">
            <SubmitButton />
        </div>

        {/* All other form fields remain the same */}
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
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
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
        <div className="space-y-2">
          <label className={labelStyles}>Item Location</label>
          <button type="button" onClick={detectMyLocation} className="flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
            <FaMapMarkerAlt />
            Detect My Location
          </button>
          <div className="mt-2">
             <label htmlFor="locationDescription" className="text-xs text-gray-500">Location Name (e.g., Sandton, Johannesburg)</label>
             <input name="locationDescription" id="locationDescription" type="text" placeholder="Enter a suburb or city" required className={inputStyles} />
          </div>
          <MapSelector onLocationSelect={handleLocationSelect} initialPosition={location ? [location.lat, location.lng] : undefined} />
          <input type="hidden" name="latitude" value={location?.lat ?? ''} />
          <input type="hidden" name="longitude" value={location?.lng ?? ''} />
        </div>
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
      </form>
    </div>
  );
}