// src/app/components/MobileMenu.tsx

'use client';

import Link from 'next/link';
import { type User } from '@supabase/supabase-js';
import { type Profile } from '@/types';
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { useAuthModal } from '@/context/AuthModalContext';
import { usePathname } from 'next/navigation';
// FIX: Import useState and useEffect
import { useEffect, useState, Fragment } from 'react';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    profile: Profile | null;
}

export default function MobileMenu({ isOpen, onClose, user, profile }: MobileMenuProps) {
    const { openModal } = useAuthModal();
    const pathname = usePathname();
    // FIX: Add a state to track if the component has mounted on the client
    const [isClient, setIsClient] = useState(false);

    // FIX: Set the component as mounted
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        if (isOpen) {
            onClose();
        }
    }, [pathname, isOpen, onClose]);

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50 md:hidden">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                </Transition.Child>

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="-translate-x-full"
                    enterTo="translate-x-0"
                    leave="ease-in duration-200"
                    leaveFrom="translate-x-0"
                    leaveTo="-translate-x-full"
                >
                    <DialogPanel className="fixed inset-y-0 left-0 w-full max-w-sm bg-white p-6">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold text-brand">Noskem</DialogTitle>
                            <button onClick={onClose} aria-label="Close menu"><X /></button>
                        </div>
                        <div className="mt-8 flow-root">
                            <div className="-my-6 divide-y divide-gray-100">
                                <div className="space-y-2 py-6">
                                    <Link href="/marketplace" className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">Marketplace</Link>
                                    <Link href="/how-it-works" className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">How It Works</Link>
                                    <Link href="/credits/buy" className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">Buy Credits</Link>
                                    <Link href="/about" className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">About Us</Link>
                                </div>
                                <div className="py-6">
                                    {/* FIX: Only render the auth-dependent UI on the client */}
                                    {isClient ? (
                                        user ? (
                                            <Link href="/account/dashboard" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                                                My Dashboard
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    openModal('sign_in');
                                                }}
                                                className="-mx-3 block w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                                            >
                                                Log in
                                            </button>
                                        )
                                    ) : (
                                        // Optional: Show a placeholder while waiting for the client to mount
                                        <div className="h-[44px] animate-pulse bg-gray-200 rounded-lg"></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </Transition.Child>
            </Dialog>
        </Transition>
    );
}