'use client';

import { useRef } from 'react';
import ItemCard from './ItemCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';

interface ItemCarouselProps {
  title: string;
  items: ItemWithProfile[];
  user: User | null;
  likedItemIds: number[]; // Add this prop
}

export default function ItemCarousel({ title, items, user, likedItemIds }: ItemCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8; 
      const scrollTo = direction === 'left' 
        ? scrollLeft - scrollAmount
        : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  const scrollbarHide = `
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `;

  return (
    <div className="py-8">
      <style>{scrollbarHide}</style>
      <h2 className="text-2xl font-bold text-text-primary mb-4">{title}</h2>
      <div className="relative group">
        <div 
          ref={scrollRef} 
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        >
          {items.map((item) => (
            <div key={item.id} className="w-64 flex-shrink-0 snap-start">
              <ItemCard 
                item={item} 
                user={user} 
                initialHasLiked={likedItemIds.includes(item.id)} // Pass down the like status
              />
            </div>
          ))}
        </div>
        
        <button 
            onClick={() => scroll('left')} 
            className="absolute top-1/2 -translate-y-1/2 -left-4 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100" 
            aria-label="Scroll left"
        >
            <FaChevronLeft />
        </button>
        <button 
            onClick={() => scroll('right')} 
            className="absolute top-1/2 -translate-y-1/2 -right-4 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100" 
            aria-label="Scroll right"
        >
            <FaChevronRight />
        </button>
      </div>
    </div>
  );
}