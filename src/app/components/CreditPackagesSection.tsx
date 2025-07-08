/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #25 (Performance): Removed client-side data fetching (`useEffect`).
 * The component now receives the `packages` array as a prop from its Server Component parent (`HomePage`).
 * - Responsive Design: The layout has been updated to provide a better experience on both mobile and desktop.
 * - On mobile, the cards are now displayed in a single, scrollable column.
 * - On desktop, the cards are displayed in a responsive grid.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { FaCheckCircle, FaStar } from 'react-icons/fa';
import { cn } from '@/lib/utils';


type CreditPackage = {
    id: number;
    name: string;
    credits_amount: number;
    price_zar: number;
    bonus_credits: number;
    is_popular: boolean;
};

const LISTING_FEE = 25;
const PURCHASE_FEE = 25;

// The component now accepts `packages` as a prop
export default function CreditPackagesSection({ user, packages }: { user: User | null, packages: CreditPackage[] }) {
    const router = useRouter();
    const { openModal } = useAuthModal();

    const handlePurchaseClick = (packageId: number) => {
        if (!user) {
            // FIX: The openModal function was called with an incorrect argument type.
            // It expects a string of type AuthView, not an object.
            openModal('sign_in');
        } else {
            router.push(`/credits/buy?package_id=${packageId}`);
        }
    };

    return (
        <div className="bg-surface py-12 sm:py-16">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-10 sm:mb-12 px-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">Top Up Your Credits</h2>
                    <p className="text-md sm:text-lg text-text-secondary mt-2">Get the best value to list and purchase items.</p>
                </div>

                {/* RESPONSIVE LAYOUT:
                    - On mobile, a single-column layout is used for easy scrolling.
                    - On larger screens, a responsive grid is used to display the cards.
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 md:px-8">
                    {packages.map((pkg) => {
                        const totalCredits = pkg.credits_amount + pkg.bonus_credits;
                        const listingsPossible = Math.floor(totalCredits / LISTING_FEE);
                        const purchasesPossible = Math.floor(totalCredits / PURCHASE_FEE);

                        return (
                            <div
                                key={pkg.id}
                                className={cn(
                                    `border rounded-xl p-4 text-center shadow-lg transition-all relative flex flex-col h-full`,
                                    pkg.is_popular ? 'border-brand-dark border-2 scale-105 bg-white' : 'border-gray-200 bg-white hover:border-brand'
                                )}
                            >
                                {pkg.is_popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-dark text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <FaStar size={10}/> Most Popular
                                    </div>
                                )}

                                <div className="flex-grow pt-2">
                                    <h3 className="text-lg font-bold text-brand">{pkg.name}</h3>
                                    <div className="my-2">
                                        <span className="text-3xl font-extrabold text-text-primary">{pkg.credits_amount}</span>
                                        <span className="text-md text-text-secondary ml-1">Credits</span>
                                    </div>
                                    {pkg.bonus_credits > 0 && (
                                        <p className="font-semibold text-green-600 mb-2 text-sm">+ {pkg.bonus_credits} Bonus Credits!</p>
                                    )}
                                    <ul className="space-y-1 text-xs text-text-secondary mb-4 text-left">
                                        <li className="flex items-center gap-2">
                                            <FaCheckCircle className="text-green-500 flex-shrink-0" />
                                            <span>List up to <strong>{listingsPossible} items</strong></span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <FaCheckCircle className="text-green-500 flex-shrink-0" />
                                            <span>Purchase up to <strong>{purchasesPossible} items</strong></span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="mt-auto">
                                    <p className="text-xl font-bold text-text-primary mb-4">
                                        R{pkg.price_zar}
                                    </p>
                                    <button onClick={() => handlePurchaseClick(pkg.id)} className="w-full block px-4 py-2 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors text-sm">
                                        Purchase Now
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}