'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './Button'; 
import { ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  // The backgroundImageUrl constant is no longer needed.

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
      {/* FIX: The section now uses a solid background color instead of an image.
        The arbitrary value bg-[#022b35] sets the color you requested.
      */}
      <section 
        className="w-full overflow-hidden rounded-2xl shadow-lg bg-[#022b35] text-white text-center py-20 sm:py-24"
        aria-label="Hero Banner"
      >
        {/* FIX: The overlay div has been removed as it's no longer needed. */}
        <div className="px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
            The Smart Way to Sell & Buy
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
            Noskem is South Africa's #1 trusted marketplace. We connect you directly with the right buyers who are willing to pay the right price for your goods.
          </p>
          <div className="mt-8">
            <Link href="/items/new">
                <Button 
                    size="lg" 
                    className="bg-brand text-white hover:bg-brand-dark font-bold shadow-lg transform hover:scale-105 transition-transform"
                >
                    Start Selling Today <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};