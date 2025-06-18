// File: app/credits/buy/page.tsx

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { FaCoins, FaCheckCircle } from 'react-icons/fa';
import BuyCreditsButton from './BuyCreditsButton'; // Import our new component

type CreditPackage = {
    id: number;
    name: string;
    description: string;
    credits_amount: number;
    price_zar: number;
    bonus_credits: number;
    features: string[];
};

export default async function BuyCreditsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    const { data: packages, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('price_zar', { ascending: true });

    if (error) {
        console.error("Error fetching credit packages:", error);
    }

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white">Buy Credits</h1>
                <p className="text-lg text-gray-400 mt-2">Choose a package that suits your needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(packages as CreditPackage[] || []).map((pkg) => (
                    <div key={pkg.id} className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-indigo-400">{pkg.name}</h2>
                            <p className="text-gray-400 text-sm mb-4">{pkg.description}</p>
                            <div className="flex justify-center items-baseline my-4">
                                <span className="text-4xl font-extrabold text-white">{pkg.credits_amount}</span>
                                <span className="text-xl text-gray-300 ml-1">Credits</span>
                            </div>
                            {pkg.bonus_credits > 0 && (
                                <p className="text-yellow-400 font-semibold mb-4">+ {pkg.bonus_credits} Bonus!</p>
                            )}
                        </div>
                        
                        <ul className="space-y-2 text-sm text-gray-300 mb-6 flex-grow">
                            {(pkg.features || []).map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <FaCheckCircle className="text-green-500 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="text-center mt-auto">
                            <p className="text-3xl font-bold text-white mb-4">
                                R{pkg.price_zar}
                            </p>
                            {/* --- USE THE NEW FUNCTIONAL BUTTON --- */}
                            <BuyCreditsButton
                                packageId={pkg.id}
                                userEmail={user.email || ''}
                                priceZAR={pkg.price_zar}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}