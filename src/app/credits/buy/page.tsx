import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { FaCheckCircle, FaShoppingCart } from 'react-icons/fa';
import BuyCreditsButton from './BuyCreditsButton';
import { type Profile } from '@/types';

type CreditPackage = {
    id: number;
    name: string;
    description: string;
    credits_amount: number;
    price_zar: number;
    bonus_credits: number;
    is_popular: boolean;
};

const LISTING_FEE = 25;
const PURCHASE_FEE = 25;

export default async function BuyCreditsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/?authModal=true');
    }
    
    const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', user.id).single() as { data: Profile | null };

    const { data: packages, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('price_zar', { ascending: true });

    if (error) {
        console.error("Error fetching credit packages:", error);
    }

    return (
        <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-100 p-4 sm:p-6 lg:p-8">
            {/* Decorative Background Icons */}
            <FaShoppingCart className="absolute text-brand/5 text-[30rem] -top-24 -right-24 rotate-12" />
            <FaShoppingCart className="absolute text-brand/5 text-[20rem] bottom-12 -left-32 -rotate-12" />
            
            <div className="relative container mx-auto max-w-7xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight">Top Up Your Credits</h1>
                    <p className="text-lg text-text-secondary mt-2 max-w-2xl mx-auto">
                        Your current balance is <span className="font-bold text-brand">{profile?.credit_balance || 0} credits</span>.
                        Choose a package below to list more items and make purchases.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                    {(packages as CreditPackage[] || []).map((pkg) => {
                        const totalCredits = pkg.credits_amount + (pkg.bonus_credits || 0);
                        const listingsPossible = Math.floor(totalCredits / LISTING_FEE);
                        const purchasesPossible = Math.floor(totalCredits / PURCHASE_FEE);

                        return (
                            <div key={pkg.id} className={`
                                border rounded-2xl p-6 text-center shadow-lg transition-all relative flex flex-col bg-surface
                                ${pkg.is_popular ? 'border-brand border-2 scale-105' : 'border-gray-200 hover:shadow-brand/20 hover:border-brand/50'}
                            `}>
                                {pkg.is_popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                                        Best Value
                                    </div>
                                )}
                                
                                <div className="flex-grow">
                                    <h3 className="text-2xl font-bold text-brand">{pkg.name}</h3>
                                    <p className="text-sm text-text-secondary my-2 h-10">{pkg.description}</p>
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
                                    <BuyCreditsButton
                                        packageId={pkg.id}
                                        userEmail={user.email || ''}
                                        priceZAR={pkg.price_zar}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}