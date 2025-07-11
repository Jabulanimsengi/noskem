'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaPlusCircle, FaCoins, FaHeart, FaChevronDown, FaBullhorn } from 'react-icons/fa'; // Added FaBullhorn
import { MessageSquare } from 'lucide-react';
import { type User } from '@supabase/supabase-js';
import SearchBar from './SearchBar';
import AuthButton from './AuthButton';
import NotificationBell from './NotificationBell';
import { type Profile } from '@/types';
import { getGuestLikes } from '@/utils/guestLikes';
import { useAuthModal } from '@/context/AuthModalContext'; 

interface HeaderProps {
    user: User | null;
    profile: Profile | null;
    initialLikesCount: number;
}

export default function Header({ user, profile, initialLikesCount }: HeaderProps) {
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
    const howItWorksRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const { openModal } = useAuthModal(); 

    useEffect(() => {
        setIsClient(true);
    }, []);

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

    const handleNotificationClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault(); 
            openModal('sign_in');
        }
    };

    const likesHref = user ? "/account/dashboard/liked" : "/likes";
    const navLinkClasses = "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ease-in-out hover:bg-white/10";
    const iconLinkClasses = "relative flex items-center p-2 rounded-full transition-all duration-200 ease-in-out hover:bg-white/10";

    return (
        <header className="bg-slate-800 sticky top-0 z-40 shadow-md">
            {/* --- DESKTOP HEADER --- */}
            <div className="hidden lg:block">
                <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-white">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                                <FaShoppingCart className="h-7 w-7" />
                                <span className="text-2xl font-extrabold tracking-tight">NOSKEM</span>
                            </Link>
                        </div>
                        <div className="flex-1 justify-center px-8">
                            <SearchBar />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm font-semibold">
                                <Link href="/about" className={navLinkClasses}>About Us</Link>
                                
                                {/* --- NEW LINK ADDED HERE --- */}
                                <Link href="/advertise-services" className={navLinkClasses}>Advertise</Link>

                                <div ref={howItWorksRef} className="relative group">
                                    <button onClick={() => setIsHowItWorksOpen(prev => !prev)} className={navLinkClasses}>
                                        <span>How It Works</span>
                                        <FaChevronDown size={12} className="transition-transform duration-200 group-hover:rotate-180" />
                                    </button>
                                    {isHowItWorksOpen && (
                                        <div className="absolute top-full mt-2 w-56 rounded-md shadow-lg bg-surface ring-1 ring-black ring-opacity-5 z-50 text-text-primary">
                                            <div className="py-1">
                                                <Link href="/how-it-works#for-users" onClick={() => setIsHowItWorksOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">For Users</Link>
                                                <Link href="/how-it-works#for-agents" onClick={() => setIsHowItWorksOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">For Agents</Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isClient ? (
                                user ? (
                                    <div className="flex items-center gap-2 ml-4">
                                        <Link href="/items/new" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand bg-white rounded-lg hover:bg-gray-200 transition-colors shadow" title="Sell an Item">
                                            <FaPlusCircle size={18} />
                                            <span>Sell</span>
                                        </Link>
                                        <Link href="/credits/buy" className={iconLinkClasses} title="Your Credits">
                                            <FaCoins className="h-5 w-5 text-yellow-500" />
                                            <span className="ml-1 font-bold">{profile?.credit_balance ?? 0}</span>
                                        </Link>
                                        <Link href={likesHref} title="My Liked Items" className={iconLinkClasses}>
                                            <FaHeart size={22} />
                                            {likesCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center rounded-full bg-red-600 text-white">{likesCount}</span>}
                                        </Link>
                                        <Link href="/chat" title="Messages" className={iconLinkClasses}>
                                            <MessageSquare size={22} />
                                        </Link>
                                        <div onClick={handleNotificationClick} className="cursor-pointer">
                                            <NotificationBell />
                                        </div>
                                        <div className="h-8 border-l border-white/30 mx-2"></div>
                                        <AuthButton user={user} profile={profile} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 ml-4">
                                        <Link href={likesHref} title="My Liked Items" className={iconLinkClasses}>
                                            <FaHeart size={22} />
                                            {likesCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center rounded-full bg-red-600 text-white">{likesCount}</span>}
                                        </Link>
                                        <div className="ml-2">
                                            <AuthButton user={user} profile={profile} />
                                        </div>
                                    </div>
                                )
                            ) : <div className="h-10 w-64 animate-pulse bg-white/20 rounded-lg ml-4"></div>}
                        </div>
                    </div>
                </nav>
            </div>

            {/* --- MOBILE HEADER --- */}
            <div className="lg:hidden p-3 text-white">
                <div className="flex items-center justify-between mb-3">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <FaShoppingCart className="h-7 w-7 text-white" />
                        <span className="text-2xl font-extrabold tracking-tight text-white">NOSKEM</span>
                    </Link>
                    <div className="flex items-center gap-3">
                         {isClient && !user && (
                             <AuthButton user={user} profile={profile} />
                         )}
                         {isClient && user && (
                            <>
                                <Link href="/chat" title="Messages" className={iconLinkClasses}><MessageSquare size={22} /></Link>
                                <div onClick={handleNotificationClick} className="cursor-pointer"><NotificationBell /></div>
                                <AuthButton user={user} profile={profile} />
                            </>
                         )}
                    </div>
                </div>
                <SearchBar />
                {/* --- NEW LINKS FOR MOBILE --- */}
                <div className="flex items-center justify-center gap-4 text-sm font-semibold pt-3">
                    <Link href="/about" className={navLinkClasses}>About</Link>
                    <Link href="/advertise-services" className={navLinkClasses}>Advertise</Link>
                    <Link href="/how-it-works" className={navLinkClasses}>How It Works</Link>
                </div>
            </div>
        </header>
    );
}