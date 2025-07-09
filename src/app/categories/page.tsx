// src/app/categories/page.tsx

import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import PageHeader from '@/app/components/PageHeader';
import BackButton from '@/app/components/BackButton';

// This function fetches the category data on the server
async function getCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* FIX: Correctly position the Back button for mobile view */}
      <div className="lg:hidden mb-4">
        <BackButton />
      </div>

      <PageHeader
        title="All Categories"
        description="Browse items by category."
      />

      <div className="mt-8 bg-white rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {categories.length > 0 ? (
            categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/search?category=${category.slug}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 mr-3 text-gray-400" />
                    <span className="font-medium text-gray-800">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 hover:text-brand">View</span>
                </Link>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500">
              No categories found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}