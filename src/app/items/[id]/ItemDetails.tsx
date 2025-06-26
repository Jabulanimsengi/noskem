'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type ItemDataWithCategory } from './page';
import Avatar from '@/app/components/Avatar';
import { FaMapMarkerAlt, FaTag } from 'react-icons/fa';

// FIX: Update the props interface to include the missing location_description
interface ItemDetailsProps {
    item: ItemDataWithCategory & {
        location_description: string | null;
    };
}

// Helper function to format condition text
const formatCondition = (condition: string) => {
    return condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function ItemDetails({ item }: ItemDetailsProps) {
    // FIX: Safely handle the images array, filtering out any non-string values
    const images = (item.images || []).filter((img): img is string => typeof img === 'string');

    // FIX: Use the sanitized images array and provide a robust fallback
    const [selectedImage, setSelectedImage] = useState(images[0] || 'https://placehold.co/600x400?text=No+Image');

    return (
        <div className="bg-surface rounded-xl shadow-md overflow-hidden">
            {/* Image Gallery */}
            <div className="relative w-full aspect-video bg-gray-200">
                <Image
                    src={selectedImage}
                    alt={item.title}
                    fill={true}
                    priority={true}
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
            {images.length > 1 && (
                <div className="p-2 bg-gray-50 flex space-x-2 overflow-x-auto">
                    {images.map((img, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedImage(img)}
                            className={`relative w-20 h-20 rounded-md overflow-hidden cursor-pointer flex-shrink-0 border-2 ${selectedImage === img ? 'border-brand' : 'border-transparent'}`}
                        >
                            <Image
                                src={img}
                                alt={`Thumbnail ${index + 1}`}
                                fill={true}
                                style={{ objectFit: 'cover' }}
                                sizes="80px"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Item Information */}
            <div className="p-6">
                <div className="mb-4">
                    <Link href={`/category/${item.categories?.name.toLowerCase() || 'uncategorized'}`}>
                        <span className="text-sm font-semibold text-brand hover:underline">{item.categories?.name || 'Uncategorized'}</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-text-primary mt-1">{item.title}</h1>
                </div>

                {/* Price */}
                <div className="mb-6">
                    <p className="text-4xl font-extrabold text-brand-dark">
                        R{item.buy_now_price?.toFixed(2)}
                    </p>
                </div>

                {/* Description */}
                <div className="prose max-w-none text-text-secondary mb-6">
                    <h3 className="text-lg font-bold text-text-primary">Description</h3>
                    <p>{item.description}</p>
                </div>

                {/* Details Table */}
                <div>
                    <h3 className="text-lg font-bold text-text-primary mb-3">Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-background p-3 rounded-lg flex items-center gap-3">
                            <FaTag className="text-gray-400 h-5 w-5" />
                            <div>
                                <p className="text-text-secondary">Condition</p>
                                <p className="font-semibold text-text-primary">{formatCondition(item.condition)}</p>
                            </div>
                        </div>
                        <div className="bg-background p-3 rounded-lg flex items-center gap-3">
                            <FaMapMarkerAlt className="text-gray-400 h-5 w-5" />
                            <div>
                                <p className="text-text-secondary">Location</p>
                                {/* FIX: Use the location_description from the updated props */}
                                <p className="font-semibold text-text-primary">{item.location_description || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="bg-background p-3 rounded-lg flex items-center gap-3 col-span-1 sm:col-span-2">
                             {/* FIX: Safely access profile data and provide fallbacks */}
                            <Avatar src={item.profiles?.avatar_url} alt={item.profiles?.username || 'Seller'} size={32} />
                            <div>
                                <p className="text-text-secondary">Seller</p>
                                <p className="font-semibold text-text-primary">{item.profiles?.username || 'Unknown Seller'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}