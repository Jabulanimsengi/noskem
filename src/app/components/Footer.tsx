// src/app/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-surface py-12 px-4 mt-16 border-t-4 border-brand">
            <div className="max-w-7xl mx-auto text-center">
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mb-8">
                    {/* Links have been moved to the header */}
                    <Link href="#" className="text-brand-dark hover:underline">Help Center</Link>
                    <Link href="#" className="text-brand-dark hover:underline">Terms of Service</Link>
                    <Link href="#" className="text-brand-dark hover:underline">Privacy Policy</Link>
                </div>
                <p className="text-text-secondary">&copy; {new Date().getFullYear()} MarketHub. All rights reserved.</p>
            </div>
        </footer>
    );
}