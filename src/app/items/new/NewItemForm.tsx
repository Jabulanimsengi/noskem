// src/app/items/new/NewItemForm.tsx
'use client';

import { useState, useCallback, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { type Category } from '@/types';

// --- Core Imports ---
import { createClient } from '@/utils/supabase/client';
import { createItemAction } from '../actions';

// --- UI & Context Imports ---
import { useToast } from '@/context/ToastContext';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import { LISTING_FEE } from '@/lib/constants';

// --- Icon Imports ---
import { FaTimes, FaSpinner, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import Image from 'next/image';

// --- Dynamic Component Import ---
const MapSelector = dynamic(() => import('./MapSelector'), {
  ssr: false,
  loading: () => <div className="h-72 bg-gray-200 rounded-lg flex items-center justify-center"><p>Loading Map...</p></div>
});


export default function NewItemForm({ categories }: { categories: Category[] }) {
  // --- State Hooks ---
  const router = useRouter();
  const { showToast } = useToast();
  const { showConfirmation, hideConfirmation } = useConfirmationModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDescription, setLocationDescription] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const MAX_IMAGES = 5;

  useEffect(() => {
    // Cleanup for image previews
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // --- Main Form Submission Handler ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    
    // --- START: Client-Side Validation ---
    if (!formData.get('title')?.toString().trim()) {
      showToast('Please enter a title for your item.', 'error');
      return;
    }
    if (!formData.get('price')) {
      showToast('Please enter a price for your item.', 'error');
      return;
    }
     if (!formData.get('category')) {
      showToast('Please select a category for your item.', 'error');
      return;
    }
    if (images.length === 0) {
      showToast('Please upload at least one image.', 'error');
      return;
    }
    if (!location) {
      showToast('Please select a location on the map.', 'error');
      return;
    }
    // --- END: Client-Side Validation ---

    showConfirmation({
      title: 'Confirm Listing Fee',
      message: `A non-refundable fee of ${LISTING_FEE} credits will be charged to list this item. Do you agree?`,
      confirmText: 'Agree & List Item',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const uploadedImageUrls: string[] = [];
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            throw new Error('You must be logged in to upload images.');
          }

          for (const file of images) {
            const fileName = `${user.id}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('item-images').upload(fileName, file);
            if (error) {
              throw new Error(`Image upload failed: ${error.message}`);
            }
            const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(data.path);
            uploadedImageUrls.push(publicUrl);
          }
          
          formData.append('imageUrls', JSON.stringify(uploadedImageUrls));
          formData.append('latitude', location.lat.toString());
          formData.append('longitude', location.lng.toString());

          const result = await createItemAction(formData);

          hideConfirmation();

          if (result.success) {
            showToast(result.message, 'success');
            router.push('/account/dashboard/my-listings');
          } else {
            showToast(result.message, 'error');
            setIsSubmitting(false);
          }
        } catch (error) {
          hideConfirmation();
          showToast(error instanceof Error ? error.message : 'An unexpected error occurred.', 'error');
          setIsSubmitting(false);
        }
      },
      onCancel: () => {
        setIsSubmitting(false);
      }
    });
  };

  // --- All other helper functions (handleImageChange, detectMyLocation, etc.) remain the same ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.size <= 10 * 1024 * 1024);
      if (Array.from(e.target.files).length > newFiles.length) {
        showToast('Some images were too large (max 10MB) and were not added.', 'error');
      }
      const combinedFiles = [...images, ...newFiles].slice(0, MAX_IMAGES);
      setImages(combinedFiles);

      const urls = combinedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(urls);
    }
  };

  const handleRemoveImage = (index: number) => {
    const remainingImages = images.filter((_, i) => i !== index);
    setImages(remainingImages);

    const newPreviews = remainingImages.map(file => URL.createObjectURL(file));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(newPreviews);
  };
  
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng });
  }, []);
  
  const detectMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setLocationDescription(data.display_name);
            showToast('Location detected!', 'success');
          }
        } catch (error) {
          showToast('Could not fetch address for your location.', 'error');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        showToast('Unable to retrieve your location.', 'error');
        setIsDetectingLocation(false);
      }
    );
  };

  const handleLocationSearch = async () => {
    if (!locationDescription.trim()) {
      showToast('Please enter a location to search.', 'error');
      return;
    }
    setIsSearchingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationDescription)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        showToast('Location found!', 'success');
      } else {
        showToast('Location not found.', 'error');
      }
    } catch (error) {
      showToast('Failed to search for location.', 'error');
    } finally {
      setIsSearchingLocation(false);
    }
  };


  // --- Component Render ---
  const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div className="container mx-auto max-w-2xl py-8">
      {/* Add noValidate to prevent default browser validation from interfering */}
      <form onSubmit={handleSubmit} noValidate className="p-8 bg-surface rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-text-primary">List a New Item</h1>
        
        <div>
          <label htmlFor="title" className={labelStyles}>Title</label>
          <input name="title" id="title" type="text" required className={inputStyles}/>
        </div>
        <div>
          <label htmlFor="description" className={labelStyles}>Description</label>
          <textarea name="description" id="description" rows={4} className={inputStyles}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className={labelStyles}>Your Selling Price (R)</label>
              <input name="price" id="price" type="number" step="0.01" required className={inputStyles} placeholder="e.g., 750.00"/>
            </div>
            <div>
              <label htmlFor="new_item_price" className={labelStyles}>Price When New (R) (Optional)</label>
              <input name="new_item_price" id="new_item_price" type="number" step="0.01" className={inputStyles} placeholder="e.g., 1500.00"/>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelStyles}>Category</label>
            <select name="category" id="category" required className={inputStyles} defaultValue="">
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
        </div>
        <div className="space-y-2">
          <label className={labelStyles}>Item Location</label>
          <button type="button" onClick={detectMyLocation} disabled={isDetectingLocation} className="flex items-center gap-2 text-sm font-semibold text-brand hover:underline disabled:text-gray-400">
            {isDetectingLocation ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
            {isDetectingLocation ? 'Detecting...' : 'Detect My Location'}
          </button>
          <div className="mt-2">
            <label htmlFor="locationDescription" className="text-xs text-gray-500">Location Name (e.g., Sandton, Johannesburg)</label>
            <div className="flex items-center gap-2">
              <input name="locationDescription" id="locationDescription" type="text" placeholder="Enter a suburb or city" required className={inputStyles} value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)} />
              <button type="button" onClick={handleLocationSearch} disabled={isSearchingLocation} className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:bg-gray-400">
                {isSearchingLocation ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              </button>
            </div>
          </div>
          <MapSelector onLocationSelect={handleLocationSelect} initialPosition={location ? [location.lat, location.lng] : undefined} />
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
        <div className="pt-4 border-t">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <FaSpinner className="animate-spin" /> : `List Item (Cost: ${LISTING_FEE} Credits)`}
          </button>
        </div>
      </form>
    </div>
  );
}
