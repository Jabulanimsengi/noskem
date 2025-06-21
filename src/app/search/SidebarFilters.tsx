'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SidebarFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State for controlled inputs
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [conditions, setConditions] = useState<string[]>(searchParams.getAll('condition'));

  // Update URL when filters change (with debouncing for price)
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (minPrice) params.set('min_price', minPrice); else params.delete('min_price');
      if (maxPrice) params.set('max_price', maxPrice); else params.delete('max_price');
      
      params.delete('condition'); // Clear existing conditions
      conditions.forEach(c => params.append('condition', c)); // Add current ones

      router.push(`${pathname}?${params.toString()}`);
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [minPrice, maxPrice, conditions, pathname, router, searchParams]);

  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setConditions(prev => 
      checked ? [...prev, value] : prev.filter(c => c !== value)
    );
  };
  
  const conditionOptions = ['new', 'like_new', 'used_good', 'used_fair'];

  return (
    <aside className="w-full lg:w-64 space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Price Range</h3>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Min" 
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-full text-sm rounded-md border-gray-300" 
          />
          <span>-</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-full text-sm rounded-md border-gray-300" 
          />
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Condition</h3>
        <div className="space-y-2">
            {conditionOptions.map(condition => (
                <label key={condition} className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        value={condition}
                        checked={conditions.includes(condition)}
                        onChange={handleConditionChange}
                        className="rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span className="text-sm capitalize">{condition.replace('_', ' ')}</span>
                </label>
            ))}
        </div>
      </div>
    </aside>
  );
}