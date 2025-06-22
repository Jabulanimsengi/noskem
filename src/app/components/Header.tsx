'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import { type Notification } from './NotificationBell';
import HeaderLayout from './HeaderLayout';
import HeaderSkeleton from './skeletons/HeaderSkeleton';

type Profile = {
    credit_balance: number;
    role: string | null;
    username: string | null;
    avatar_url: string | null;
};

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        
        const fetchData = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (currentUser) {
                const [profileRes, notificationsRes] = await Promise.all([
                    supabase.from('profiles').select('credit_balance, role, avatar_url, username').eq('id', currentUser.id).single(),
                    supabase.from('notifications').select('*').eq('profile_id', currentUser.id).order('created_at', { ascending: false }).limit(20)
                ]);
                setProfile(profileRes.data as Profile | null);
                setNotifications((notificationsRes.data as Notification[]) || []);
            }
            setIsLoading(false);
        };

        fetchData();

        // This listener ensures the header updates instantly when a user signs in or out.
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                fetchData(); // Refetch data on sign-in
            } else if (event === 'SIGNED_OUT') {
                setProfile(null);
                setNotifications([]);
                setIsLoading(false);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    // Display a skeleton while the user data is being fetched
    if (isLoading) {
        return <HeaderSkeleton />;
    }

    return <HeaderLayout user={user} profile={profile} notifications={notifications} />;
}