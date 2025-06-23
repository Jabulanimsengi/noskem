'use client';

import { type Item } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import { deleteItemAction } from './actions';
import Image from 'next/image';
import Link from 'next/link';
import { FaEye } from 'react-icons/fa';

interface MyListingsClientProps {
  items: Item[];
}

export default function MyListingsClient({ items }: MyListingsClientProps) {
  const { showToast } = useToast();
  const { showConfirmation } = useConfirmationModal();

  const handleDelete = (item: Item) => {
    showConfirmation({
      title: 'Delete Listing',
      message: `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const result = await deleteItemAction(item.id);
          if (result.success) {
            showToast(result.message, 'success');
          }
        } catch (error: any) {
          showToast(error.message, 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-text-primary mb-4">My Listings</h2>
      {items.length > 0 ? (
        items.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border gap-4">
            <div className="flex items-center gap-4 w-full">
              <Image
                src={Array.isArray(item.images) && item.images.length > 0 ? (item.images[0] as string) : 'https://placehold.co/64x64/27272a/9ca3af?text=No+Image'}
                alt={item.title || 'Item Image'}
                width={64}
                height={64}
                className="rounded-md object-cover flex-shrink-0"
              />
              <div className="flex-grow">
                <p className="font-semibold text-text-primary truncate">{item.title}</p>
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span className={`font-semibold capitalize px-2 py-0.5 rounded-full ${
                      item.status === 'available' ? 'bg-green-100 text-green-800' : 
                      item.status === 'sold' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>{item.status?.replace('_', ' ')}</span>
                    <div className="flex items-center gap-1">
                        <FaEye />
                        <span>{item.view_count || 0} views</span>
                    </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-shrink-0">
              <button
                onClick={() => handleDelete(item)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
              >
                Delete
              </button>
              <Link
                href={`/account/dashboard/my-listings/${item.id}/edit`}
                className="px-3 py-1.5 text-xs font-medium text-white bg-brand rounded-md hover:bg-brand-dark"
              >
                Edit
              </Link>
            </div>
          </div>
        ))
      ) : (
        <p className="text-text-secondary text-center py-8">You have not listed any items yet.</p>
      )}
    </div>
  );
}