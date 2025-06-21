import Link from 'next/link';
import { FaHeart } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="bg-surface py-8 px-4 mt-16 border-t-2 border-gray-100">
            <div className="max-w-7xl mx-auto text-center">
                {/* FIX: Removed outdated links and comment. Added new, relevant links. */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mb-6">
                    <Link href="/about" className="text-text-secondary hover:text-brand hover:underline">About Us</Link>
                    <Link href="/how-it-works" className="text-text-secondary hover:text-brand hover:underline">How It Works</Link>
                    <Link href="#" className="text-text-secondary hover:text-brand hover:underline">Help Center</Link>
                    <Link href="#" className="text-text-secondary hover:text-brand hover:underline">Terms of Service</Link>
                </div>
                <div className="flex justify-center items-center gap-2 text-text-secondary">
                  <span>&copy; {new Date().getFullYear()} Noskem.</span>
                  <span>Made with <FaHeart className="inline text-red-500" /> in South Africa.</span>
                </div>
            </div>
        </footer>
    );
}