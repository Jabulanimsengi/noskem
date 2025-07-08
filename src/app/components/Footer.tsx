// src/app/components/Footer.tsx

import Link from 'next/link';
import { FaShoppingCart } from 'react-icons/fa';

export default function Footer() {
  return (
    // FIX: Changed background color to match the header
    <footer className="bg-slate-800 text-white">
      <div className="container mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <FaShoppingCart className="h-7 w-7" />
              <span className="text-2xl font-extrabold tracking-tight">
                NOSKEM
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-300">
              The trusted way to buy and sell secondhand goods in South Africa.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/marketplace" className="text-base text-gray-300 hover:text-white">Marketplace</Link></li>
              <li><Link href="/how-it-works" className="text-base text-gray-300 hover:text-white">How It Works</Link></li>
              <li><Link href="/about" className="text-base text-gray-300 hover:text-white">About Us</Link></li>
              <li><Link href="/credits/buy" className="text-base text-gray-300 hover:text-white">Buy Credits</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/contact" className="text-base text-gray-300 hover:text-white">Contact Us</Link></li>
              <li><Link href="/faq" className="text-base text-gray-300 hover:text-white">FAQ</Link></li>
              <li><Link href="/terms" className="text-base text-gray-300 hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-base text-gray-300 hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase">Connect</h3>
            {/* Add social media links here if you have them */}
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Noskem. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}