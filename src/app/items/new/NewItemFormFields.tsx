// src/app/items/new/NewItemFormFields.tsx

'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { type Category } from '@/types';
import { useFormStatus } from 'react-dom';
import { Button } from '@/app/components/Button';
import { DollarSign, Package, MapPin, Tag as CategoryIcon, Pencil } from 'lucide-react';

const ImageUploader = dynamic(() => import('@/app/components/ImageUploader'), { ssr: false });
const LocationInput = dynamic(() => import('@/app/components/LocationInput'), { ssr: false });

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg" className="w-full !py-3 !text-base">
            {pending ? 'Submitting...' : 'Submit Listing (25 Credits)'}
        </Button>
    );
}

const FormSection = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="space-y-4 pt-8 border-t first:border-t-0 first:pt-0">
        <div className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <div className="pl-9 space-y-6">{children}</div>
    </div>
);

export default function NewItemFormFields({ categories }: { categories: Category[] }) {
    const [location, setLocation] = useState<{
        description: string;
        lat: number;
        lng: number;
    } | null>(null);

    const handleLocationSelect = useCallback((selectedLocation: { description: string; lat: number; lng: number } | null) => {
        setLocation(selectedLocation);
    }, []);

    const inputClass = "block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand focus:ring-1 focus:ring-brand sm:text-base p-3";

    return (
        <div className="space-y-12">
            <div className="bg-brand text-white p-6 rounded-lg text-center">
                <h1 className="text-3xl font-bold">List a New Item</h1>
                <p className="text-white font-semibold mt-2">Fill out the details below to put your item up for sale.</p>
            </div>

            {/* Removed imageUrls hidden input as files are directly part of FormData from ImageUploader */}
            <input type="hidden" name="latitude" value={location?.lat || ''} />
            <input type="hidden" name="longitude" value={location?.lng || ''} />
            <input type="hidden" name="locationDescription" value={location?.description || ''} />
            
            <FormSection title="What are you selling?" icon={Pencil}>
                 <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" name="title" id="title" required className={inputClass} placeholder="e.g., Vintage Leather Sofa" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" id="description" rows={5} className={inputClass} placeholder="Describe the item's condition, features, and any flaws."></textarea>
                </div>
            </FormSection>

            <FormSection title="Upload Photos" icon={Package}>
                {/* ImageUploader's internal input handles name="images" directly for server action */}
                <ImageUploader onFilesChange={() => {}} /> {/* A no-op handler, as files are submitted directly via form data */}
            </FormSection>

            <FormSection title="Pricing & Details" icon={DollarSign}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Your Selling Price (R)</label>
                        <input type="number" name="price" id="price" required min="0" step="0.01" className={inputClass} placeholder="e.g., 4500.00" />
                    </div>
                    <div>
                        <label htmlFor="new_item_price" className="block text-sm font-medium text-gray-700 mb-1">Original Price (R) (Optional)</label>
                        <input type="number" name="new_item_price" id="new_item_price" min="0" step="0.01" className={inputClass} placeholder="e.g., 9000.00" />
                    </div>
                    <div>
                        <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                        <select name="condition" id="condition" required className={inputClass}>
                            <option value="new">New</option>
                            <option value="like_new">Like New</option>
                            <option value="used_good">Used - Good</option>
                            <option value="used_fair">Used - Fair</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700 mb-1">Date of Purchase (Optional)</label>
                        <input type="date" name="purchase_date" id="purchase_date" className={inputClass} />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Categorization & Location" icon={CategoryIcon}>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select name="category" id="category" required className={inputClass}>
                        <option value="">Select a category...</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                 <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-xs text-gray-500 mb-2">This helps buyers find items near them.</p>
                    <LocationInput onLocationSelect={handleLocationSelect} />
                </div>
            </FormSection>

            <div className="pt-8 border-t">
                <SubmitButton />
            </div>
        </div>
    );
}