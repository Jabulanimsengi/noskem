// src/app/components/Header.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaBars, FaPlusCircle, FaCoins, FaHeart, FaChevronDown } from 'react-icons/fa';
import { MessageSquare } from 'lucide-react';
import { type User } from '@supabase/supabase-js';
import SearchBar from './SearchBar';
import AuthButton from './AuthButton';
import MobileMenu from './MobileMenu';
import NotificationBell from './NotificationBell';
import { type Profile } from '@/types';
import { getGuestLikes } from '@/utils/guestLikes';

interface HeaderProps {
  user: User | null;
  profile: Profile | null;
  initialLikesCount: number;
}

export default function Header({ user, profile, initialLikesCount }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setLikesCount(initialLikesCount);
    } else {
      const updateGuestLikeCount = () => {
        setLikesCount(getGuestLikes().length);
      };
      updateGuestLikeCount();
      window.addEventListener('storage', updateGuestLikeCount);
      return () => {
        window.removeEventListener('storage', updateGuestLikeCount);
      }
    }
  }, [user, initialLikesCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (howItWorksRef.current && !howItWorksRef.current.contains(event.target as Node)) {
        setIsHowItWorksOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const likesHref = user ? "/account/dashboard/liked" : "/likes";

  return (
    <>
      <header className="bg-surface shadow-md sticky top-0 z-40">
        <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 text-brand hover:text-brand-dark transition-colors">
                <FaShoppingCart className="h-7 w-7" />
                <span className="text-2xl font-extrabold tracking-tight">
                  NOSKEM
                </span>
              </Link>
            </div>

            <div className="hidden lg:flex flex-1 justify-center px-8">
              <SearchBar />
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm font-semibold text-text-secondary">
                <Link href="/about" className="hover:text-brand transition-colors">About Us</Link>
                <div ref={howItWorksRef} className="relative group">
                  <button
                    onMouseEnter={() => setIsHowItWorksOpen(true)}
                    onMouseLeave={() => setIsHowItWorksOpen(false)}
                    className="flex items-center gap-1 hover:text-brand transition-colors"
                  >
                    <span>How It Works</span>
                    <FaChevronDown size={12} className="transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  {isHowItWorksOpen && (
                    <div
                      onMouseEnter={() => setIsHowItWorksOpen(true)}
                      onMouseLeave={() => setIsHowItWorksOpen(false)}
                      className="absolute top-full mt-2 w-56 rounded-md shadow-lg bg-surface ring-1 ring-black ring-opacity-5 z-50"
                    >
                      <div className="py-1">
                        <Link href="/how-it-works#for-users" onClick={() => setIsHowItWorksOpen(false)} className="block px-4 py-2 text-sm text-text-primary hover:bg-gray-100">For Users</Link>
                        <Link href="/how-it-works#for-agents" onClick={() => setIsHowItWorksOpen(false)} className="block px-4 py-2 text-sm text-text-primary hover:bg-gray-100">For Agents</Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {user ? (
                <div className="flex items-center gap-5 ml-6">
                  <Link
                    href="/items/new"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors shadow"
                    title="Sell an Item"
                  >
                    <FaPlusCircle size={18} />
                    <span>Sell</span>
                  </Link>
                  <Link href="/credits/buy" className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-brand" title="Your Credits">
                    <FaCoins className="h-5 w-5 text-yellow-500" />
                    <span>{profile?.credit_balance ?? 0}</span>
                  </Link>
                  <Link href={likesHref} title="My Liked Items" className="relative text-gray-500 hover:text-brand">
                    <FaHeart size={22} />
                    {likesCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 text-xs flex items-center justify-center rounded-full bg-red-600 text-white">
                        {likesCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/chat" title="Messages" className="text-gray-500 hover:text-brand">
                    <MessageSquare size={22} />
                  </Link>
                  <NotificationBell />
                  <div className="h-8 border-l border-gray-300"></div>
                  <AuthButton user={user} profile={profile} />
                </div>
              ) : (
                <div className="flex items-center gap-5 ml-6">
                  <Link href={likesHref} title="My Liked Items" className="relative text-gray-500 hover:text-brand">
                    <FaHeart size={22} />
                    {likesCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 text-xs flex items-center justify-center rounded-full bg-red-600 text-white">
                        {likesCount}
                      </span>
                    )}
                  </Link>
                  <div className="ml-4">
                    <AuthButton user={user} profile={profile} />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2" aria-label="Open menu">
                <FaBars className="h-6 w-6 text-text-primary" />
              </button>
            </div>
          </div>
        </nav>
      </header>
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        profile={profile}
      />
    </>
  );
}