// src/app/components/CategoryFilter.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

export default function CategoryFilter({ categories }: { categories: Category[] }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const currentCategory = searchParams.get('category');

    const handleFilter = (categoryName: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (categoryName) {
            params.set('category', categoryName);
        } else {
            params.delete('category');
        }
        // Ensure the user is scrolled to the listings section after filtering
        replace(`${pathname}?${params.toString()}#listings-section`);
    };

    return (
        // MOBILE OPTIMIZATION:
        // - flex-nowrap prevents buttons from wrapping.
        // - overflow-x-auto enables horizontal scrolling.
        // - justify-start aligns items to the left on mobile.
        // - Added scrollbar-hide utility class for a cleaner look (requires tailwind-scrollbar-hide plugin or custom CSS).
        <div className="flex flex-nowrap items-center justify-start space-x-2 overflow-x-auto py-4 mb-4 -mx-4 px-4 sm:justify-center sm:mx-0 sm:px-0">
            <button
                onClick={() => handleFilter(null)}
                className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-colors flex-shrink-0",
                    !currentCategory ? 'bg-brand text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                )}
            >
                All
            </button>
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => handleFilter(category.name)}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0",
                        currentCategory === category.name ? 'bg-brand text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    )}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}
