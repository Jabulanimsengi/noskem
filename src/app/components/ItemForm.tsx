// src/app/components/ItemForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from './Button';
import ImageUploader from './ImageUploader';
import LocationInput from './LocationInput';
import { DollarSign, Package, MapPin, Tag as CategoryIcon, Pencil } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { type Category, type Item, type Profile } from '@/types'; // Import necessary types

// FIX: FormSection component definition should be here if it's not imported from elsewhere.
// Assuming it's defined in this file to resolve "Cannot find module './FormSection'" error.
const FormSection = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="space-y-4 pt-8 border-t first:border-t-0 first:pt-0">
        <div className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <div className="pl-9 space-y-6">{children}</div>
    </div>
);


// Helper component for the submit button
function SubmitButton({ isExternalPending }: { isExternalPending?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || isExternalPending} className="w-full">
      {pending || isExternalPending ? 'Processing...' : 'Save Listing'}
    </Button>
  );
}

// Define props for ItemForm
interface ItemFormProps {
  item?: Item | null; // Optional item for editing
  profile?: Profile | null; // Optional profile for location
  categories: Category[]; // Categories are required
  onSubmit: (formData: FormData) => Promise<any>; // onSubmit is required
  isSubmitting?: boolean; // Optional prop to control submission state from parent
}


export default function ItemForm({ item, profile, categories, onSubmit, isSubmitting: isExternalPending = false }: ItemFormProps) {
  const { showToast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // State to hold newly uploaded files
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]); // State to hold existing image URLs

  // Pre-fill form fields for editing
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    categoryId: item?.category_id?.toString() || '',
    condition: item?.condition || '',
    buyNowPrice: item?.buy_now_price?.toString() || '',
    locationDescription: item?.location_description || '',
    latitude: item?.latitude?.toString() || '',
    longitude: item?.longitude?.toString() || '',
    newItemPrice: item?.new_item_price?.toString() || '', // Added
    purchaseDate: item?.purchase_date || '', // Added
  });


  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        categoryId: item.category_id?.toString() || '',
        condition: item.condition || '',
        buyNowPrice: item.buy_now_price?.toString() || '',
        locationDescription: item.location_description || '',
        latitude: item.latitude?.toString() || '',
        longitude: item.longitude?.toString() || '',
        newItemPrice: item.new_item_price?.toString() || '',
        purchaseDate: item.purchase_date || '',
      });
      // Ensure existing images are strings if they come as Json
      const existing = (item.images || []).filter((img): img is string => typeof img === 'string');
      setInitialImageUrls(existing);
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // FIX: Updated handleLocationSelect to match LocationInput's expected signature
  const handleLocationSelect = (location: { description: string; lat: number; lng: number } | null) => {
    setFormData(prev => ({
      ...prev,
      latitude: location?.lat?.toString() || '',
      longitude: location?.lng?.toString() || '',
      locationDescription: location?.description || '',
    }));
  };

  // Handler for files change from ImageUploader
  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
  };


  // Wrap the onSubmit handler to include files
  const handleSubmitWrapper = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    const form = e.currentTarget;
    const data = new FormData(form);

    // Append newly selected files to FormData
    selectedFiles.forEach((file) => {
      data.append(`newImages`, file); // Use a new name for new images
    });

    // Append existing image URLs as a JSON string or individual fields
    // This is crucial if existing images are handled separately for updates
    // For simplicity, let's append them as a JSON string.
    data.append('existingImageUrls', JSON.stringify(initialImageUrls));

    // Append item ID for editing
    if (item?.id) {
      data.append('itemId', item.id.toString());
    }

    await onSubmit(data); // Call the passed onSubmit prop
  };

  return (
    <form onSubmit={handleSubmitWrapper} className="space-y-8 max-w-3xl mx-auto py-8">
      {/* Basic Info */}
      <FormSection title="Basic Information" icon={Pencil}>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text-secondary">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full border border-border rounded-md shadow-sm p-2"
            required
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full border border-border rounded-md shadow-sm p-2"
            maxLength={1000}
          ></textarea>
        </div>
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-text-secondary">Category</label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="mt-1 block w-full border border-border rounded-md shadow-sm p-2"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-text-secondary">Condition</label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="mt-1 block w-full border border-border rounded-md shadow-sm p-2"
            required
          >
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="used_good">Used (Good)</option>
            <option value="used_fair">Used (Fair)</option>
          </select>
        </div>
      </FormSection>

      {/* Upload Photos */}
      <FormSection title="Upload Photos" icon={Package}>
        {/* FIX: Pass the onFilesChange and existingImages props to ImageUploader */}
        <ImageUploader onFilesChange={handleFilesChange} existingImages={initialImageUrls} />
      </FormSection>

      {/* Pricing & Details */}
      <FormSection title="Pricing & Details" icon={DollarSign}>
        <div>
          <label htmlFor="buyNowPrice" className="block text-sm font-medium text-text-secondary">Your Selling Price (R)</label>
          <input
            type="number"
            id="buyNowPrice"
            name="buyNowPrice"
            value={formData.buyNowPrice}
            onChange={handleChange}
            className="mt-1 block w-full border border-border rounded-md shadow-sm p-2"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div>
          <label htmlFor="newItemPrice" className="block text-sm font-medium text-text-secondary">Price When New (R) (Optional)</label>
          <input
            type="number"
            id="newItemPrice"
            name="newItemPrice"
            value={formData.newItemPrice}
            onChange={handleChange}
            className="mt-1 block w-full border border-border rounded-md shadow-sm p-2"
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-text-secondary">Original Purchase Date (Optional)</label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="mt-1 block w-full border border-border rounded-md shadow-sm p-2"
          />
        </div>
      </FormSection>

      {/* Location */}
      <FormSection title="Location" icon={MapPin}>
        <LocationInput
          // FIX: Pass initial values as required by LocationInputProps
          initialLatitude={item?.latitude || profile?.latitude || undefined}
          initialLongitude={item?.longitude || profile?.longitude || undefined}
          initialLocationDescription={item?.location_description || profile?.address || undefined}
          onLocationSelect={handleLocationSelect}
        />
        {/* These hidden inputs will be populated by handleLocationSelect */}
        <input type="hidden" name="latitude" value={formData.latitude} />
        <input type="hidden" name="longitude" value={formData.longitude} />
        <input type="hidden" name="locationDescription" value={formData.locationDescription} />
      </FormSection>

      <SubmitButton isExternalPending={isExternalPending} />
    </form>
  );
}