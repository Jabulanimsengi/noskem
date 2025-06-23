'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  // REPLACE THIS URL with the actual public URL of your 'image_01.jpeg' or any other image.
  // Since the context is South Africa, I'm using a relevant stock image URL.
  const backgroundImageUrl = 'image_01.jpeg'
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
      <section
        className="relative w-full overflow-hidden rounded-2xl shadow-lg bg-cover bg-center text-white text-center"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        aria-label="Hero Banner"
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 px-4 py-20 sm:py-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-shadow-lg">
            The Smart Way to Sell & Buy in South Africa
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto text-shadow">
            Noskem is South Africa's #1 trusted marketplace. We connect you directly with the right buyers who are willing to pay the right price for your goods.
          </p>
          <div className="mt-8">
            <Link href="/items/new">
                <Button
                    size="lg"
                    className="bg-brand text-white hover:bg-brand-dark font-bold shadow-lg transform hover:scale-105 transition-transform ring-2 ring-offset-2 ring-offset-black/50 ring-transparent focus:ring-brand"
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