'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { ArrowRight, Search } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
      <section
        className="w-full overflow-hidden rounded-2xl shadow-lg bg-gradient-to-r from-cyan-900 to-gray-800 text-white text-center py-20 sm:py-24"
        aria-label="Hero Banner"
      >
        <div className="px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight">
            The Trusted Way to Buy & Sell
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
            Noskem is South Africa's managed marketplace. We verify every item, so you can transact with complete confidence.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/items/new">
                <Button
                    size="lg"
                    className="bg-brand text-white hover:bg-brand-dark font-bold shadow-lg transform hover:scale-105 transition-transform w-full sm:w-auto"
                >
                    Start Selling Today <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>
             <Link href="/marketplace">
                <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white/90 text-brand hover:bg-white font-bold shadow-lg w-full sm:w-auto"
                >
                    <Search className="mr-2 h-5 w-5" /> Explore Listings
                </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};