'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';

// Debounce hook to prevent excessive API calls while user is typing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function HomepageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for each filter
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const initialConditions = useMemo(() => searchParams.getAll('condition'), [searchParams]);
  const [conditions, setConditions] = useState<string[]>(initialConditions);
  const [sort, setSort] = useState(searchParams.get('sort') || 'created_at.desc');

  // Debounce price inputs to improve performance
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  // This effect listens for changes in any filter and updates the URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedMinPrice) params.set('min_price', debouncedMinPrice); else params.delete('min_price');
    if (debouncedMaxPrice) params.set('max_price', debouncedMaxPrice); else params.delete('max_price');
    
    params.delete('condition');
    conditions.forEach(c => params.append('condition', c));
    params.set('sort', sort);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

  }, [debouncedMinPrice, debouncedMaxPrice, conditions, sort, pathname, router, searchParams]);

  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setConditions(prev => 
      checked ? [...prev, value] : prev.filter(c => c !== value)
    );
  };
  
  const conditionOptions = ['new', 'like_new', 'used_good', 'used_fair'];
  
  // FIX: Redesigned the entire component for better visibility and usability.
  return (
    <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            
            {/* Price Range Filter */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Price Range</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        placeholder="Min" 
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        className="w-full text-base p-2 border-gray-300 rounded-lg shadow-sm focus:ring-brand focus:border-brand"
                    />
                    <span className="text-gray-500 font-semibold">-</span>
                    <input 
                        type="number" 
                        placeholder="Max" 
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        className="w-full text-base p-2 border-gray-300 rounded-lg shadow-sm focus:ring-brand focus:border-brand"
                    />
                </div>
            </div>

            {/* Condition Filter */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Condition</label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                    {conditionOptions.map(condition => (
                        <label key={condition} className="flex items-center gap-2.5 cursor-pointer">
                            <input 
                                type="checkbox" 
                                value={condition}
                                checked={conditions.includes(condition)}
                                onChange={handleConditionChange}
                                className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-2 focus:ring-brand/50"
                            />
                            <span className="text-base text-gray-800 capitalize">{condition.replace(/_/g, ' ')}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Sort By Filter */}
            <div className="space-y-2">
                <label htmlFor="sort" className="text-sm font-semibold text-gray-700">Sort by</label>
                <select
                    id="sort"
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="w-full text-base rounded-lg border-gray-300 shadow-sm focus:ring-brand focus:border-brand p-2.5"
                >
                    <option value="created_at.desc">Newest First</option>
                    <option value="buy_now_price.asc">Price: Low to High</option>
                    <option value="buy_now_price.desc">Price: High to Low</option>
                </select>
            </div>
        </div>
    </div>
  );
}