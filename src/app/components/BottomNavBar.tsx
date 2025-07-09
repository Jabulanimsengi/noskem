// src/app/components/BottomNavBar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// FIX: Changed Search icon to Grid for Categories
import { Home, Grid, PlusSquare, Heart, User as UserIcon } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { getGuestLikes } from '@/utils/guestLikes';
import { createClient } from '@/utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import { useAuthModal } from '@/context/AuthModalContext';

const supabase = createClient();

// FIX: Updated nav items for the new layout
const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/categories', label: 'Categories', icon: Grid }, // 'Search' becomes 'Categories'
  { href: '/items/new', label: 'Sell', icon: PlusSquare },
  { href: '/likes', label: 'Likes', icon: Heart },
  { href: '/account', label: 'Account', icon: UserIcon }, // Generic href for account logic
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openModal } = useAuthModal();
  const [user, setUser] = useState<User | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndLikes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        setLikesCount(count ?? 0);
      } else {
        setLikesCount(getGuestLikes().length);
      }
      setIsLoading(false);
    };

    fetchUserAndLikes();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      fetchUserAndLikes(); // Re-fetch on auth change
    });

    const updateGuestLikeCount = () => {
        if (!user) setLikesCount(getGuestLikes().length);
    };
    window.addEventListener('storage', updateGuestLikeCount);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', updateGuestLikeCount);
    };
  }, []);

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    if (user) {
        router.push('/account/dashboard');
    } else {
        openModal('sign_in');
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-50">
      <div className="flex justify-around h-16">
        {navItems.map((item) => {
            const isLikesTab = item.label === 'Likes';
            const isAccountTab = item.label === 'Account';
            const href = isLikesTab ? (user ? '/account/dashboard/liked' : '/likes') : item.href;
            
            // FIX: Account tab isActive logic updated
            const isActive = isAccountTab 
                ? pathname.startsWith('/account') 
                : (href === '/' ? pathname === href : pathname.startsWith(href));

            if (isAccountTab) {
                // Special handling for the Account tab to use onClick
                return (
                    <a
                        key={item.label}
                        href={href}
                        onClick={handleAccountClick}
                        className="flex flex-col items-center justify-center text-center w-full hover:bg-gray-100 transition-colors duration-200 relative"
                    >
                        <item.icon className={cn('h-6 w-6 mb-1 transition-colors', isActive ? 'text-brand' : 'text-gray-500')} />
                        <span className={cn('text-xs font-medium transition-colors', isActive ? 'text-brand' : 'text-gray-600')}>{item.label}</span>
                    </a>
                );
            }

            return (
              <Link
                key={item.label}
                href={href}
                className="flex flex-col items-center justify-center text-center w-full hover:bg-gray-100 transition-colors duration-200 relative"
              >
                <item.icon className={cn('h-6 w-6 mb-1 transition-colors', isActive ? 'text-brand' : 'text-gray-500')} />
                <span className={cn('text-xs font-medium transition-colors', isActive ? 'text-brand' : 'text-gray-600')}>
                  {item.label}
                </span>
                {isLikesTab && !isLoading && likesCount > 0 && (
                  <span className="absolute top-1 right-[calc(50%-22px)] h-5 w-5 text-xs flex items-center justify-center rounded-full bg-red-600 text-white">
                    {likesCount}
                  </span>
                )}
              </Link>
            );
        })}
      </div>
    </nav>
  );
}