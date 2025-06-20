'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './Button'; 
import { ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
      <section 
        className="relative w-full overflow-hidden rounded-2xl shadow-lg bg-gradient-to-r from-brand to-brand-dark text-white text-center py-16 sm:py-20"
        aria-label="Hero Banner"
      >
        <div className="relative z-10 px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            The Smart Way to Sell & Buy
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
            Noskem is South Africa's #1 trusted marketplace. We connect you directly with the right buyers who are willing to pay the right price for your goods.
          </p>
          <div className="mt-8">
            <Link href="/items/new">
                {/* --- FIX IS HERE --- */}
                {/* Using a bright cyan background with a very dark text color from your palette for maximum visibility. */}
                <Button 
                    size="lg" 
                    className="bg-cyan-400 text-[#033a47] hover:bg-cyan-300 font-bold shadow-lg transform hover:scale-105 transition-transform"
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