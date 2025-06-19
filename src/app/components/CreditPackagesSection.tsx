// src/app/components/CreditPackagesSection.tsx
import { createClient } from '../utils/supabase/server';
import Link from 'next/link';
import { FaCheckCircle } from 'react-icons/fa';

type CreditPackage = {
    id: number;
    name: string;
    credits_amount: number;
    price_zar: number;
    bonus_credits: number;
    is_popular: boolean; // Add the new field
};

// Constants for our credit costs
const LISTING_FEE = 25;
const PURCHASE_FEE = 25;

export default async function CreditPackagesSection() {
    const supabase = await createClient();
    // Fetch ALL packages now, not just a limited number
    const { data: packages } = await supabase
        .from('credit_packages')
        .select('*')
        .order('price_zar', { ascending: true });

    return (
        <div className="bg-surface py-16">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-brand-dark">Top Up Your Credits</h2>
                    <p className="text-lg text-text-secondary mt-2">Get the best value to list and purchase items.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                    {(packages as CreditPackage[] || []).map((pkg) => {
                        // Calculate what the user can do with the credits
                        const totalCredits = pkg.credits_amount + pkg.bonus_credits;
                        const listingsPossible = Math.floor(totalCredits / LISTING_FEE);
                        const purchasesPossible = Math.floor(totalCredits / PURCHASE_FEE);

                        return (
                            <div 
                                key={pkg.id} 
                                className={`
                                    border rounded-xl p-6 text-center shadow-lg transition-all relative flex flex-col
                                    ${pkg.is_popular 
                                        ? 'border-brand-dark border-2 scale-105 bg-white' // Highlight style
                                        : 'border-gray-200 bg-white hover:border-brand'
                                    }
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

                                    {/* Descriptive capabilities */}
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
                                    <Link href="/credits/buy" className="w-full block px-6 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
                                        Purchase Now
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}