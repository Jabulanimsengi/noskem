'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import HeaderLayout from './HeaderLayout';
import HeaderSkeleton from './skeletons/HeaderSkeleton';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { type Profile } from '@/types';

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const router = useRouter();
    const hasShownLoginToast = useRef(false);

    useEffect(() => {
        const supabase = createClient();
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setIsLoading(false);
        };
        getInitialSession();

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
        return () => subscription.unsubscribe();
    }, [showToast]);

    useEffect(() => {
        const supabase = createClient();
        const fetchDataForUser = async (userToFetch: User) => {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userToFetch.id).single();
            setProfile(profileData as Profile | null);
            if (profileData && !profileData.username) {
                if (window.location.pathname !== '/account/complete-profile') {
                    router.push('/account/complete-profile');
                }
            }
            // FIX: Notification fetching is now removed from this component.
        };

        if (user) {
            fetchDataForUser(user);
        } else {
            setProfile(null);
        }
    }, [user, router]);

    if (isLoading) {
        return <HeaderSkeleton />;
    }

    // FIX: Pass only the user and profile to the layout.
    return <HeaderLayout user={user} profile={profile} />;
}