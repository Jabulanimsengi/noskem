// src/app/components/BottomNavBar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Heart, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGuestLikes } from '@/utils/guestLikes';
import { createClient } from '@/utils/supabase/client';
import { type User } from '@supabase/supabase-js';

// Helper to create a client-side Supabase client
const supabase = createClient();

/**
 * A list of navigation items for the bottom bar.
 */
const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Categories', icon: Search },
  { href: '/items/new', label: 'Sell', icon: PlusSquare },
  // The href for 'Likes' will now be determined dynamically.
  { href: '/likes', label: 'Likes', icon: Heart },
  { href: '/account/dashboard', label: 'Account', icon: UserIcon },
];

/**
 * A fixed bottom navigation bar for mobile screens, with a dynamic likes count.
 */
export default function BottomNavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndLikes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setLikesCount(count ?? 0);
      } else {
        setLikesCount(getGuestLikes().length);
      }
      setIsLoading(false);
    };

    fetchUserAndLikes();

    // Listen for auth changes to re-fetch likes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      fetchUserAndLikes();
    });

    // Listen for guest like changes
    const updateGuestLikeCount = () => {
      if (!user) {
        setLikesCount(getGuestLikes().length);
      }
    };
    window.addEventListener('storage', updateGuestLikeCount);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', updateGuestLikeCount);
    };
  }, []); // Run only once on mount

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-50">
      <div className="flex justify-around h-16">
        {navItems.map((item) => {
          const isLikesTab = item.label === 'Likes';
          // FIX: The href for the "Likes" tab is now conditional.
          // It points to the user's dashboard if logged in, or the public likes page if not.
          const href = isLikesTab ? (user ? '/account/dashboard/liked' : '/likes') : item.href;
          
          const isActive = href === '/' ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={item.label} // Use label for a stable key
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
