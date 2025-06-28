'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useToast } from '@/context/ToastContext';

export default function SidebarFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [conditions, setConditions] = useState<string[]>(searchParams.getAll('condition'));
  const [onSale, setOnSale] = useState(searchParams.get('on_sale') === 'true');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (minPrice) params.set('min_price', minPrice); else params.delete('min_price');
      if (maxPrice) params.set('max_price', maxPrice); else params.delete('max_price');
      
      params.delete('condition');
      conditions.forEach(c => params.append('condition', c));

      if (onSale) params.set('on_sale', 'true'); else params.delete('on_sale');

      router.replace(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(handler);
  }, [minPrice, maxPrice, conditions, onSale, pathname, router, searchParams]);

  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setConditions(prev => 
      checked ? [...prev, value] : prev.filter(c => c !== value)
    );
  };

  const handleSearchNearby = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            const params = new URLSearchParams(searchParams.toString());
            params.set('lat', latitude.toString());
            params.set('lon', longitude.toString());
            router.push(`${pathname}?${params.toString()}`);
            setIsLocating(false);
        }, (error) => {
            showToast('Could not get your location.', 'error');
            setIsLocating(false);
        });
    } else {
        showToast('Geolocation is not supported by your browser.', 'error');
        setIsLocating(false);
    }
  };
  
  const conditionOptions = ['new', 'like_new', 'used_good', 'used_fair'];

  return (
    <aside className="w-full lg:w-72 space-y-8 p-6 bg-surface rounded-xl shadow-md">
      <div>
        <h3 className="text-lg font-semibold mb-3 text-text-primary">Price Range</h3>
        <div className="flex items-center gap-3">
          <input 
            type="number" 
            placeholder="Min" 
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-full text-base p-2.5 rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" 
          />
          <span className="text-gray-400">-</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-full text-base p-2.5 rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" 
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3 text-text-primary">Condition</h3>
        <div className="space-y-3">
            {conditionOptions.map(condition => (
                <label key={condition} className="flex items-center gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        value={condition}
                        checked={conditions.includes(condition)}
                        onChange={handleConditionChange}
                        className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span className="text-base text-text-primary capitalize">{condition.replace(/_/g, ' ')}</span>
                </label>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 text-text-primary">Deals</h3>
         <label className="flex items-center gap-3 cursor-pointer">
            <input 
                type="checkbox"
                checked={onSale}
                onChange={(e) => setOnSale(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <span className="text-base text-text-primary">On Sale</span>
        </label>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3 text-text-primary">Location</h3>
        <button
            onClick={handleSearchNearby}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark disabled:bg-gray-400"
        >
            <FaMapMarkerAlt />
            {isLocating ? 'Locating...' : 'Search Near Me'}
        </button>
      </div>

    </aside>
  );
}