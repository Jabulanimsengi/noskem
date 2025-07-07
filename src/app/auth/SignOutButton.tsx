'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { signOutAction } from '@/app/auth/actions';
import { Button } from '@/app/components/Button'; // Assuming you have a general Button component

export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    startTransition(async () => {
      const result = await signOutAction();

      if (result.success) {
        // Show the success toast immediately
        showToast('You have been signed out successfully.', 'success');
        
        // --- THIS IS THE FIX ---
        // We delay the navigation slightly to ensure the toast is visible before the page reloads.
        setTimeout(() => {
          router.push('/');
          router.refresh(); 
        }, 100); // A 100ms delay is usually enough for the toast to render.

      } else if (result.error) {
        // Show an error toast if sign-out fails
        showToast(`Sign out failed: ${result.error}`, 'error');
      }
    });
  };

  return (
    <Button onClick={handleSignOut} disabled={isPending} variant="ghost">
      {isPending ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}