// src/app/components/SearchBar.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Search } from 'lucide-react';
import Link from 'next/link';

type SearchResultItem = {
  id: number;
  title: string;
};

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('items')
        .select('id, title')
        .textSearch('fts', searchTerm, { type: 'plain', config: 'english' })
        .limit(5);

      if (data) {
        setResults(data);
        setIsOpen(true);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleFullSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleFullSearch}>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm && results.length > 0 && setIsOpen(true)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
            placeholder="Search for anything..."
            autoComplete="off"
          />
          <button type="submit" aria-label="Search" className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </form>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <ul>
              {results.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/items/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-3 hover:bg-gray-100"
                  >
                    <Search className="text-gray-400 mr-3 h-4 w-4" />
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-gray-500 text-sm">No results found.</p>
          )}
        </div>
      )}
    </div>
  );
}