'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import Avatar from './Avatar';
import { FaChevronDown } from 'react-icons/fa';
import { useToast } from '@/context/ToastContext';
import { signOutAction } from '@/app/auth/actions';
import { type Profile } from '@/types';

interface AuthButtonProps {
  user: User | null;
  profile: Profile | null;
}

export default function AuthButton({ user, profile }: AuthButtonProps) {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const { showConfirmation } = useConfirmationModal();
  const { showToast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    showConfirmation({
        title: 'Confirm Sign Out',
        message: 'Are you sure you want to sign out?',
        onConfirm: async () => {
            const result = await signOutAction();
            if (result.success) {
                showToast("You have been signed out successfully.", 'success');
                router.push('/');
            } else if (result.error) {
                showToast(result.error, 'error');
            }
        }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return user ? (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <Avatar src={profile?.avatar_url} alt={profile?.username || 'User'} size={32} />
        <FaChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-surface ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-text-primary truncate">{profile?.username || 'User'}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link href="/account/dashboard" onClick={() => setIsOpen(false)} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100">
                My Dashboard
              </Link>
              <Link href="/account/dashboard/profile" onClick={() => setIsOpen(false)} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100">
                Edit Profile
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100">
                  Admin Panel
                </Link>
              )}
              {profile?.role === 'agent' && (
                <Link href="/agent/dashboard" onClick={() => setIsOpen(false)} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100">
                  Agent Dashboard
                </Link>
              )}
            </div>
            
            {/* FIX: Old Credit Balance Link Removed From Dropdown */}
            
            <div className="py-1 border-t border-gray-200">
              <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <button onClick={() => openModal('sign_in')} className="px-4 py-2 text-sm font-semibold text-text-primary hover:bg-gray-100 rounded-md">
        Sign In
      </button>
      <Link href="/signup" className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark">
        Sign Up
      </Link>
    </div>
  );
}