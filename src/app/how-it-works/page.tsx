import { FaSearch, FaGavel, FaHandshake, FaBox, FaUserSecret, FaRoute, FaCheckDouble } from 'react-icons/fa';
import { Button } from '@/app/components/Button';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'How Noskem Works | Secure Managed Marketplace',
    description: 'Learn how Noskem provides a simple, secure, and transparent process for buying, selling, and agent-based verification.',
};


const StepCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description:string }) => (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white rounded-xl shadow-lg border">
        <div className="flex-shrink-0 bg-brand/10 text-brand p-4 rounded-full">
            <Icon className="h-8 w-8" />
        </div>
        <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
            <p className="mt-2 text-gray-600">{description}</p>
        </div>
    </div>
);

export default function HowItWorksPage() {
    return (
        <div className="bg-gray-50">
            <div className="container mx-auto max-w-5xl py-16 px-4">

                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-brand tracking-tight">How Noskem Works</h1>
                    <p className="text-lg text-gray-600 mt-3">A simple, secure, and transparent process for everyone involved.</p>
                </div>

                {/* Section for Buyers and Sellers */}
                <section id="for-users" className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">For Buyers & Sellers</h2>
                    <div className="space-y-8">
                        <StepCard icon={FaSearch} title="1. Find or List Your Item" description="Buyers browse thousands of listings. Sellers list items in minutes, setting their price with guidance from our valuation tools."/>
                        <StepCard icon={FaGavel} title="2. Negotiate & Agree" description="Buyers can make a secure offer or buy instantly. Our platform facilitates fair negotiation until both parties agree on a price."/>
                        <StepCard icon={FaHandshake} title="3. Secure Payment & Escrow" description="The buyer pays through our secure Paystack gateway. We hold the funds in escrow, protecting both buyer and seller."/>
                        <StepCard icon={FaBox} title="4. Agent-Managed Handover" description="Once payment is confirmed, we assign a local agent to inspect and collect the item from the seller, ensuring it matches the description before it's delivered to the buyer."/>
                    </div>
                </section>

                {/* Section for Agents */}
                <section id="for-agents" className="mb-16 pt-12 border-t">
                    <h2 className="text-3xl font-bold text-center mb-8">For Agents</h2>
                    <div className="space-y-8">
                         <StepCard icon={FaUserSecret} title="1. Accept Local Tasks" description="Browse available tasks in your area from your Agent Dashboard. Accept jobs to inspect and collect items from sellers."/>
                         <StepCard icon={FaCheckDouble} title="2. Inspect & Report" description="Travel to the seller's location, carefully inspect the item for quality and authenticity, and file a detailed report with photos directly through the app."/>
                         <StepCard icon={FaRoute} title="3. Secure Collection & Delivery" description="Once your report is approved, securely collect the item and transport it to our local hub or directly for delivery, getting paid for every completed task."/>
                    </div>
                     <div className="text-center mt-10">
                        <Link href="/signup?role=agent">
                            <Button size="lg">Become a Noskem Agent</Button>
                        </Link>
                    </div>
                </section>

                {/* Section for Drivers */}
                <section id="for-drivers" className="pt-12 border-t">
                     <h2 className="text-3xl font-bold text-center mb-8">For Drivers</h2>
                     <p className="text-center text-gray-600 -mt-4 mb-8">Our agents also handle driving and logistics.</p>
                     <div className="text-center bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-lg">
                        <p className="font-semibold">Our agents are responsible for the full-service verification and handover process, which includes driving to collect and deliver items. If you're interested in driving for Noskem, the "Agent" role is for you!</p>
                    </div>
                </section>
            </div>
        </div>
    );
}