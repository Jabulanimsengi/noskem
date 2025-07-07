// src/app/auth/SignOutButton.tsx
'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
// Corrected import path for the Button component
import { Button } from '@/app/components/Button'; 
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
    } else {
      // Redirect to the homepage and refresh to clear the cache
      router.push('/');
      router.refresh();
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      className="w-full flex justify-start items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      <span>Sign Out</span>
    </Button>
  );
}