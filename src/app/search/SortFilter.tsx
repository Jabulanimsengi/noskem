'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function SortFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-base font-medium text-text-secondary">Sort by:</label>
      <select
        id="sort"
        name="sort"
        onChange={handleSortChange}
        defaultValue={searchParams.get('sort') || 'created_at.desc'}
        className="text-base rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand py-2.5 pl-3 pr-8"
      >
        <option value="created_at.desc">Newest First</option>
        <option value="buy_now_price.asc">Price: Low to High</option>
        <option value="buy_now_price.desc">Price: High to Low</option>
      </select>
    </div>
  );
}