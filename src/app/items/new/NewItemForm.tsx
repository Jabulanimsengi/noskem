'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { type User } from '@supabase/supabase-js';

// IMPORTANT: Double-check this bucket name against your Supabase dashboard!
const BUCKET_NAME = 'item-images';

export default function NewItemForm({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('used_good');
  const [images, setImages] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    if (images.length === 0) {
      setError('Please upload at least one image.');
      setIsSubmitting(false);
      return;
    }

    try {
      const uploadedImageUrls: string[] = [];

      for (const image of images) {
        const fileName = `${user.id}/${Date.now()}_${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, image);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(uploadData.path);
        
        uploadedImageUrls.push(urlData.publicUrl);
      }

      const { error: insertError } = await supabase.from('items').insert({
        seller_id: user.id,
        title: title,
        description: description,
        buy_now_price: parseFloat(price),
        condition: condition,
        images: uploadedImageUrls, // Save as a proper array
        status: 'available',
      });

      if (insertError) {
        throw new Error(`Failed to list item: ${insertError.message}`);
      }

      router.push('/');
      router.refresh();

    } catch (e: any) {
      setError(e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container p-4 mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-6">List a New Item</h1>
      <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded-lg space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Buy Now Price (R)</label>
          <input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">Condition</label>
          <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)} required className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" >
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="used_good">Used (Good)</option>
            <option value="used_fair">Used (Fair)</option>
          </select>
        </div>
        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-300 mb-1">Images</label>
          <input id="images" type="file" multiple onChange={handleImageChange} accept="image/*" required className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" />
        </div>
        {error && (<div className="p-3 text-center text-white bg-red-500 rounded-md">{error}</div>)}
        <div>
          <button type="submit" disabled={isSubmitting} className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed" >
            {isSubmitting ? 'Listing Item...' : 'List Item'}
          </button>
        </div>
      </form>
    </div>
  );
}