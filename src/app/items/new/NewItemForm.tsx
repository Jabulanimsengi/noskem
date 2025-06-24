'use client';

import { useState, useEffect, useCallback, useActionState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { listItemAction, type ListItemFormState } from './actions';
import { FaTimes, FaSpinner, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import Image from 'next/image';
import { type Category } from '@/types';
import { useToast } from '@/context/ToastContext';
import { createClient } from '@/app/utils/supabase/client';

const MapSelector = dynamic(() => import('./MapSelector'), { 
  ssr: false,
  loading: () => <div className="h-72 bg-gray-200 rounded-lg flex items-center justify-center"><p>Loading Map...</p></div>
});

const initialState: ListItemFormState = { error: null, success: false };

export default function NewItemForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [state, formAction] = useActionState(listItemAction, initialState);
  const [isPending, startTransition] = useTransition();
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationDescription, setLocationDescription] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  // FIX: Add a new state to track the auto-detection process
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    startTransition(async () => {
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
        
        if (!formRef.current) {
          throw new Error("Form reference is not available.");
        }
        const formData = new FormData(formRef.current);

        uploadedImageUrls.forEach(url => formData.append('imageUrls', url));
        formAction(formData);
      } catch (error: any) {
        showToast(error.message || "A client-side error occurred.", 'error');
      }
    });
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
  
  // FIX: Updated the "Detect My Location" function
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

        // Call the reverse geocoding API
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setLocationDescription(data.display_name);
            showToast('Location detected and filled in!', 'success');
          } else {
            showToast('Location detected, but could not find an address.', 'info');
          }
        } catch (error) {
          showToast('Could not fetch address for your location.', 'error');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        showToast('Unable to retrieve your location. Please check your browser permissions.', 'error');
        setIsDetectingLocation(false);
      }
    );
  };
  
  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => { urls.forEach(URL.revokeObjectURL); };
  }, [images]);

  const handleLocationSearch = async () => {
    if (!locationDescription.trim()) {
      showToast('Please enter a location name to search.', 'error');
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
        showToast('Location not found. Please try a different name.', 'error');
      }
    } catch (error) {
      showToast('Failed to search for location.', 'error');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-1";
  
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <form ref={formRef} onSubmit={handleSubmit} className="p-8 bg-surface rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-text-primary">List a New Item</h1>
        
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
          <button 
            type="button" 
            onClick={detectMyLocation} 
            className="flex items-center gap-2 text-sm font-semibold text-brand hover:underline disabled:text-gray-400 disabled:no-underline"
            disabled={isDetectingLocation}
          >
            {isDetectingLocation ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
            {isDetectingLocation ? 'Detecting...' : 'Detect My Location'}
          </button>
          <div className="mt-2">
             <label htmlFor="locationDescription" className="text-xs text-gray-500">Location Name (e.g., Sandton, Johannesburg)</label>
             <div className="flex items-center gap-2">
                <input 
                  name="locationDescription" 
                  id="locationDescription" 
                  type="text" 
                  placeholder="Enter a suburb or city" 
                  required 
                  className={inputStyles}
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={handleLocationSearch}
                  disabled={isSearchingLocation}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
                >
                  {isSearchingLocation ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                </button>
             </div>
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
        
        {state.error && (
          <div className="p-3 text-center text-sm font-semibold text-white bg-red-500 rounded-md">
            {state.error}
          </div>
        )}

        <div className="pt-4 border-t">
            <button 
              type="submit" 
              disabled={isPending} 
              className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isPending && <FaSpinner className="animate-spin" />}
              {isPending ? 'Processing...' : 'List Item (Cost: 25 Credits)'}
            </button>
        </div>
      </form>
    </div>
  );
}