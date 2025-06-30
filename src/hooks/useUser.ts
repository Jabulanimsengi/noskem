// src/hooks/useUser.ts

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import { type Profile } from '@/types';

// This custom hook provides an easy way to access the current user's
// authentication status and profile data across all client components.
export function useUser() {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            // Get the current user session from Supabase auth
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            // If a user is logged in, fetch their corresponding profile data
            if (currentUser) {
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                setProfile(userProfile);
            }
            setIsLoading(false);
        };

        fetchUserData();

        // Set up a listener for authentication state changes (e.g., sign-in, sign-out)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const newUser = session?.user ?? null;
            setUser(newUser);
            
            // Clear the profile on sign-out
            if (event === 'SIGNED_OUT') {
                setProfile(null);
            }
            
            // Fetch the new user's profile on sign-in
            if (event === 'SIGNED_IN' && newUser) {
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', newUser.id)
                    .single();
                setProfile(userProfile);
            }
        });

        // Cleanup the listener when the component is no longer in use
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase]);

    return { user, profile, isLoading };
}