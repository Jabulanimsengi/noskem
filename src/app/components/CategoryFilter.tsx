'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type Category } from '@/types';

interface CategoryFilterProps {
  categories: Category[];
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  return (
    <div className="flex justify-center flex-wrap gap-2 mb-12">
      <Link
        href="/"
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
          !currentCategory
            ? 'bg-brand text-white shadow'
            : 'bg-gray-200 text-text-secondary hover:bg-gray-300'
        }`}
      >
        All Items
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/?category=${category.slug}`}
          scroll={false} // Prevents page from jumping
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
            currentCategory === category.slug
              ? 'bg-brand text-white shadow'
              : 'bg-gray-200 text-text-secondary hover:bg-gray-300'
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}