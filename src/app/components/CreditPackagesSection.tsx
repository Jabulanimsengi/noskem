/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #25 (Performance): Removed client-side data fetching (`useEffect`).
 * The component now receives the `packages` array as a prop from its Server Component parent (`HomePage`).
 */
'use client';

import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { FaCheckCircle } from 'react-icons/fa';

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

    const handlePurchaseClick = () => {
        if (!user) {
            openModal('sign_in');
        } else {
            router.push('/credits/buy');
        }
    };

    return (
        <div className="bg-surface py-16">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-brand-dark">Top Up Your Credits</h2>
                    <p className="text-lg text-text-secondary mt-2">Get the best value to list and purchase items.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                    {packages.map((pkg) => {
                        const totalCredits = pkg.credits_amount + pkg.bonus_credits;
                        const listingsPossible = Math.floor(totalCredits / LISTING_FEE);
                        const purchasesPossible = Math.floor(totalCredits / PURCHASE_FEE);

                        return (
                            <div 
                                key={pkg.id} 
                                className={`
                                    border rounded-xl p-6 text-center shadow-lg transition-all relative flex flex-col
                                    ${pkg.is_popular ? 'border-brand-dark border-2 scale-105 bg-white' : 'border-gray-200 bg-white hover:border-brand'}
                                `}
                            >
                                {pkg.is_popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-dark text-white px-4 py-1 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </div>
                                )}
                                
                                <div className="flex-grow">
                                    <h3 className="text-2xl font-bold text-brand">{pkg.name}</h3>
                                    <div className="my-4">
                                        <span className="text-5xl font-extrabold text-text-primary">{pkg.credits_amount}</span>
                                        <span className="text-xl text-text-secondary ml-1">Credits</span>
                                    </div>
                                    {pkg.bonus_credits > 0 && (
                                        <p className="font-semibold text-green-600 mb-4">+ {pkg.bonus_credits} Bonus Credits!</p>
                                    )}
                                    <ul className="space-y-2 text-sm text-text-secondary mb-6 text-left">
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
                                    <p className="text-3xl font-bold text-text-primary mb-6">
                                        R{pkg.price_zar}
                                    </p>
                                    <button onClick={handlePurchaseClick} className="w-full block px-6 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
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