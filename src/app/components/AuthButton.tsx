// src/app/components/AuthButton.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
// --- FIX: Import new icons ---
import { FaSignOutAlt, FaTachometerAlt, FaList, FaShoppingBag, FaShieldAlt, FaBriefcase } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';
import { type Profile } from '@/types';
import { useAuthModal } from '@/context/AuthModalContext';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import { Button } from './Button';

export default function AuthButton({ user, profile }: { user: User | null; profile: Profile | null }) {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const { showConfirmation, hideConfirmation } = useConfirmationModal();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    setIsOpen(false);
    showConfirmation({
      title: 'Confirm Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      onConfirm: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        hideConfirmation();
        router.push('/');
        router.refresh(); 
      },
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user || !profile) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => openModal('sign_in')}>
          Log In
        </Button>
        <Button variant="primary" onClick={() => openModal('sign_up')}>
          Sign Up
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
      >
        <Image
          src={profile.avatar_url || 'https://placehold.co/40x40/27272a/9ca3af?text=User'}
          alt={profile.username || 'User Avatar'}
          width={40}
          height={40}
          className="rounded-full border-2 border-white/80 hover:border-white transition-all"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 rounded-md shadow-lg bg-surface ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 text-text-primary">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-semibold truncate">{profile.username}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
            
            {/* --- THIS IS THE FIX --- */}
            {/* Conditionally render Admin and Agent links based on profile.role */}
            {profile.role === 'admin' && (
              <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                <FaShieldAlt /> Admin Dashboard
              </Link>
            )}

            {profile.role === 'agent' && (
              <Link href="/agent/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
                <FaBriefcase /> Agent Dashboard
              </Link>
            )}

            {/* Add a separator if role-specific links were shown */}
            {(profile.role === 'admin' || profile.role === 'agent') && (
              <div className="border-t my-1"></div>
            )}
            {/* --- END OF FIX --- */}

            <Link href="/account/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100">
              <FaTachometerAlt /> Dashboard
            </Link>
            <Link href="/account/dashboard/my-listings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100">
              <FaList /> My Listings
            </Link>
            <Link href="/account/dashboard/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100">
              <FaShoppingBag /> My Orders
            </Link>
            <div className="border-t my-1"></div>
            <button
              onClick={handleSignOut}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}