'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthModal } from '@/context/AuthModalContext';
import { useUser } from '@/hooks/useUser';

export const HeroSection: React.FC = () => {
    const { openModal } = useAuthModal();
    const { user } = useUser();

    const handleSellClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!user) {
            e.preventDefault();
            openModal('sign_in');
        }
    };

    return (
        // This outer container centers the hero section on the page.
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 mb-8">
            {/* This section has the dark background, rounded corners, and shadow. */}
            <section
                className="overflow-hidden rounded-2xl shadow-xl bg-slate-900 text-center"
                aria-label="Hero Banner"
            >
                <div className="px-4 py-16 sm:py-24">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
                        Buy. Sell. Connect. <span className="text-brand">With Confidence.</span>
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-slate-300">
                        Noskem is South Africa’s bold new marketplace for verified second-hand deals and trusted service providers. No scams. No stress. Just serious value.
                    </p>
                    
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            href="/items/new" 
                            onClick={handleSellClick}
                            className="inline-block bg-brand text-white font-bold py-3 px-6 rounded-lg text-base hover:bg-brand-dark transition-transform hover:scale-105"
                        >
                            Sell Something Now
                        </Link>
                        <Link 
                            href="/search" 
                            className="inline-block bg-white text-brand font-bold py-3 px-6 rounded-lg text-base hover:bg-gray-200 transition-transform hover:scale-105"
                        >
                            Browse Listings
                        </Link>
                         <Link 
                            href="/advertise-services" 
                            className="inline-block bg-slate-700 text-white font-bold py-3 px-6 rounded-lg text-base hover:bg-slate-600 transition-transform hover:scale-105"
                        >
                            Advertise Your Service
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};