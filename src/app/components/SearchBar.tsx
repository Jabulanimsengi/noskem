'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';
import { FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

// The type for a single search result item
type SearchResultItem = {
    id: number;
    title: string;
    profiles: { username: string | null };
};

export default function SearchBar() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('search_items', {
        search_term: searchTerm,
      });

      if (data) {
        setResults(data);
        setIsOpen(true);
      }
      if (error) {
        console.error("Search error:", error);
        setIsOpen(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleFullSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div ref={searchRef} className="flex-1 max-w-xl hidden md:block relative">
      <form onSubmit={handleFullSearch}>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm && results.length > 0 && setIsOpen(true)}
            className="w-full px-5 py-3 border-2 border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-brand bg-background"
            placeholder="Search for anything..."
            autoComplete="off"
          />
          <button type="submit" aria-label="Search" className="absolute right-5 top-1/2 -translate-y-1/2">
              <FaSearch className="text-gray-400" />
          </button>
        </div>
      </form>
      
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-surface rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <ul>
              {results.map((item) => (
                <li key={item.id}>
                  <Link 
                    href={`/items/${item.id}`} 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-3 hover:bg-gray-100"
                  >
                    <FaSearch className="text-gray-400 mr-3" />
                    <div>
                        <p className="font-semibold text-text-primary">{item.title}</p>
                        <p className="text-sm text-text-secondary">by {item.profiles?.username || 'N/A'}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-text-secondary">No results found.</p>
          )}
        </div>
      )}
    </div>
  );
}