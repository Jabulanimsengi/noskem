// src/app/search/SidebarFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { type Category } from '@/types';
import BackButton from '@/app/components/BackButton'; // Import the BackButton

export default function SidebarFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch categories from the database when the component mounts
    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, slug')
                .order('name', { ascending: true });

            if (data) {
                setCategories(data);
            }
            setIsLoading(false);
        };

        fetchCategories();
    }, []);

    // This function builds the new URL with the category filter and navigates to it
    const handleFilterChange = (type: string, value: string) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

        if (value) {
            currentParams.set(type, value);
        } else {
            // This removes the category filter when 'Clear' is clicked
            currentParams.delete(type);
        }

        router.push(`${pathname}?${currentParams.toString()}`);
    };

    const selectedCategory = searchParams.get('category');

    return (
        <aside className="w-full lg:w-72 space-y-8 p-4 lg:p-6 bg-surface rounded-xl shadow-md">
            {/* Back button for mobile view */}
            <div className="lg:hidden">
                <BackButton />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-3 text-text-primary">Categories</h3>
                {isLoading ? (
                    // Show a loading skeleton while fetching categories
                    <div className="space-y-2">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {categories.map((category) => (
                            <li key={category.id}>
                                <button
                                    onClick={() => handleFilterChange('category', category.slug)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        selectedCategory === category.slug
                                            ? 'bg-brand text-white font-semibold'
                                            : 'hover:bg-gray-100 text-text-primary'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            </li>
                        ))}
                        {/* Show a "Clear" button only if a category is selected */}
                        {selectedCategory && (
                             <li>
                                <button
                                    onClick={() => handleFilterChange('category', '')}
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-md mt-2"
                                >
                                    Clear category
                                </button>
                            </li>
                        )}
                    </ul>
                )}
            </div>
            {/* You can add other filters like "Condition" or "Price Range" here in the future */}
        </aside>
    );
}