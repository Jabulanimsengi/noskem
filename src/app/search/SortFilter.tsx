/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #16 (Performance): Changed `router.push` to `router.replace`.
 * This updates the URL without adding a new entry to the browser's history,
 * which is better UX for sorting controls.
 */
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function SortFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    // Use router.replace() for sort changes
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm font-medium text-text-secondary">Sort by:</label>
      <select
        id="sort"
        name="sort"
        onChange={handleSortChange}
        defaultValue={searchParams.get('sort') || 'created_at.desc'}
        className="text-sm rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
      >
        <option value="created_at.desc">Newest First</option>
        <option value="buy_now_price.asc">Price: Low to High</option>
        <option value="buy_now_price.desc">Price: High to Low</option>
      </select>
    </div>
  );
}