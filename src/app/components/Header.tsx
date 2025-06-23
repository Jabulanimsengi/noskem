'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import { type Notification } from './NotificationBell';
import HeaderLayout from './HeaderLayout';
import HeaderSkeleton from './skeletons/HeaderSkeleton';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { type Profile } from '@/types';

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const router = useRouter();
    const hasShownLoginToast = useRef(false);

    // Effect 1: Handles authentication state changes from Supabase.
    // It runs only once and sets up a listener.
    useEffect(() => {
        const supabase = createClient();

        // On initial load, get the current session to set the user state.
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setIsLoading(false);
        };
        getInitialSession();

        // The listener updates the user state whenever they sign in or out.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            if (event === 'SIGNED_IN' && !hasShownLoginToast.current) {
                showToast(`Welcome back!`, 'success');
                hasShownLoginToast.current = true;
            }
            if (event === 'SIGNED_OUT') {
                hasShownLoginToast.current = false;
            }
        });

        // Cleanup the listener when the component unmounts.
        return () => {
            subscription.unsubscribe();
        };
    }, [showToast]);

    // Effect 2: Fetches user-specific data (profile, notifications)
    // ONLY when the `user` object changes (i.e., on login/logout).
    useEffect(() => {
        const supabase = createClient();
        const fetchDataForUser = async (userToFetch: User) => {
            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userToFetch.id)
                .single();

            setProfile(profileData as Profile | null);

            // Redirect to complete profile page if username is missing.
            if (profileData && !profileData.username) {
                if (window.location.pathname !== '/account/complete-profile') {
                    router.push('/account/complete-profile');
                }
            }

            // Fetch notifications
            const { data: notificationsData } = await supabase
                .from('notifications')
                .select('*')
                .eq('profile_id', userToFetch.id)
                .order('created_at', { ascending: false })
                .limit(20);
            setNotifications(notificationsData as Notification[] || []);
        };

        if (user) {
            fetchDataForUser(user);
        } else {
            // If user is null (logged out), clear their data.
            setProfile(null);
            setNotifications([]);
        }
    }, [user, router]);


    if (isLoading) {
        return <HeaderSkeleton />;
    }

    return <HeaderLayout user={user} profile={profile} notifications={notifications} />;
}