'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import { type Notification } from './NotificationBell';
import HeaderLayout from './HeaderLayout';
import HeaderSkeleton from './skeletons/HeaderSkeleton';
import { useToast } from '@/context/ToastContext';
import { useRouter, usePathname } from 'next/navigation';
import { type Profile } from '@/types';

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const hasShownLoginToast = useRef(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const supabase = createClient();
        
        const fetchData = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (currentUser) {
                const { data: fetchedProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                setProfile(fetchedProfile as Profile | null);

                // This is the redirection logic.
                if (fetchedProfile && !fetchedProfile.username) {
                    if (pathname !== '/account/complete-profile') {
                        router.push('/account/complete-profile');
                    }
                }
                
                const { data: fetchedNotifications } = await supabase.from('notifications').select('*').eq('profile_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
                setNotifications((fetchedNotifications as Notification[]) || []);
            }
            setIsLoading(false);
        };

        const onAuthStateChange = (event: string, session: any) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (event === 'SIGNED_IN') {
                if (!hasShownLoginToast.current) {
                    showToast(`Welcome back!`, 'success');
                    hasShownLoginToast.current = true;
                }
                fetchData(); 
            } else if (event === 'SIGNED_OUT') {
                setProfile(null);
                setNotifications([]);
                setIsLoading(false);
                hasShownLoginToast.current = false;
            }
        };
        
        fetchData();

        const { data: authListener } = supabase.auth.onAuthStateChange(onAuthStateChange);

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [showToast, router, pathname]);

    if (isLoading) {
        return <HeaderSkeleton />;
    }

    return <HeaderLayout user={user} profile={profile} notifications={notifications} />;
}