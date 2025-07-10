'use client';

import { useRef } from 'react';
import ServiceProviderCard, { type ServiceProviderForCard } from './ServiceProviderCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceCarouselProps {
  title: string;
  providers: ServiceProviderForCard[];
  viewAllLink?: string;
}

export default function ServiceCarousel({ title, providers, viewAllLink }: ServiceCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!providers || providers.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 relative group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-brand hover:underline">
            View all
          </Link>
        )}
      </div>

      <div className="relative">
        {/* --- Left Arrow --- */}
        <button 
          onClick={() => scroll('left')}
          // Corrected: Explicitly set background for both light and dark modes
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white dark:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
          aria-label="Scroll left"
        >
          {/* Corrected: Set icon color for both modes */}
          <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-gray-800" />
        </button>

        {/* Scrollable List */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto space-x-4 pb-4 -mb-4 scrollbar-hide"
        >
          {providers.map((provider) => (
            <div 
              key={provider.id} 
              className="flex-shrink-0 w-64 md:w-72"
            >
              <ServiceProviderCard provider={provider} />
            </div>
          ))}
        </div>

        {/* --- Right Arrow --- */}
        <button 
          onClick={() => scroll('right')}
          // Corrected: Explicitly set background for both light and dark modes
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white dark:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
          aria-label="Scroll right"
        >
          {/* Corrected: Set icon color for both modes */}
          <ChevronRight className="h-6 w-6 text-gray-800 dark:text-gray-800" />
        </button>
      </div>
    </section>
  );
}