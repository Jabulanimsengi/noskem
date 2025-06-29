'use client';

import { type Item } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import { deleteItemAction, featureItemAction, bumpListingAction } from './actions';
import Image from 'next/image';
import Link from 'next/link';
import { FaEye, FaStar, FaArrowUp } from 'react-icons/fa';
import StoreSaleManager from './StoreSaleManager';

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
            showToast(result.message || 'Listing deleted successfully.', 'success');
          }
        } catch (error) {
           const err = error as Error;
          showToast(err.message, 'error');
        }
      },
    });
  };

  const handleFeature = (item: Item) => {
    showConfirmation({
      title: 'Feature Your Listing',
      message: `Are you sure? This will cost X credits and display your item prominently on the homepage.`,
      confirmText: 'Yes, feature it!',
      onConfirm: async () => {
        try {
          const result = await featureItemAction(item.id);
          if (result.success) {
            showToast(result.message || 'Item featured successfully.', 'success');
          }
        } catch (error) {
           const err = error as Error;
          showToast(err.message, 'error');
        }
      },
    });
  };

  const handleBump = (item: Item) => {
    showConfirmation({
        title: 'Bump Your Listing',
        message: `Are you sure? This will cost X credits and move your item to the top of search results for a period.`,
        confirmText: 'Yes, Bump it!',
        onConfirm: async () => {
            try {
                const result = await bumpListingAction(item.id);
                if (result.success) {
                    showToast(result.message || 'Item bumped successfully.', 'success');
                }
            } catch (error) {
                showToast((error as Error).message, 'error');
            }
        },
    });
  };

  return (
    <div className="space-y-4">
      <StoreSaleManager />
      {items.length > 0 ? (
        items.map((item) => {
          const imageUrl = Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string' && item.images[0].startsWith('http')
            ? item.images[0]
            : 'https://placehold.co/64x64/27272a/9ca3af?text=No+Image';

          return (
            <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border gap-4">
              <div className="flex items-center gap-4 w-full">
                <Image
                  src={imageUrl}
                  alt={item.title || 'Item Image'}
                  width={64}
                  height={64}
                  className="rounded-md object-cover flex-shrink-0"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-text-primary truncate">{item.title}</p>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span className={`font-semibold capitalize px-2 py-0.5 rounded-full text-xs ${
                        item.is_featured ? 'bg-yellow-200 text-yellow-800' :
                        item.status === 'available' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.is_featured ? 'Featured' : item.status?.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                          <FaEye />
                          <span>{item.view_count || 0} views</span>
                      </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                {!item.is_featured && item.status === 'available' && (
                  <button
                    onClick={() => handleFeature(item)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 flex items-center gap-1"
                  >
                    <FaStar />
                    Feature
                  </button>
                )}
                {item.status === 'available' && (
                  <button
                    onClick={() => handleBump(item)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 flex items-center gap-1"
                  >
                    <FaArrowUp />
                    Bump
                  </button>
                )}
                {item.status === 'available' && (
                  <Link
                    href={`/account/dashboard/my-listings/${item.id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Edit
                  </Link>
                )}
                 <button
                    onClick={() => handleDelete(item)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-text-secondary text-center py-8">You have not listed any items yet.</p>
      )}
    </div>
  );
}