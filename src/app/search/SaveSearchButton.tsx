// src/app/search/SaveSearchButton.tsx
'use client';

import { useTransition } from 'react';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';
import { saveSearchAction } from './actions';
import { Button } from '@/app/components/Button';
import { Bookmark } from 'lucide-react';
import { type User } from '@supabase/supabase-js';

interface SaveSearchButtonProps {
  query: string;
  // The button now needs to know who the user is.
  user: User | null;
}

export default function SaveSearchButton({ query, user }: SaveSearchButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const { openModal } = useAuthModal();

  const handleSave = () => {
    // --- THIS IS THE FIX ---
    // If there is no user, open the sign-in modal instead of calling the action.
    if (!user) {
      openModal('sign_in');
      return;
    }

    startTransition(async () => {
      const result = await saveSearchAction(query);
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    });
  };

  if (!query) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      onClick={handleSave}
      disabled={isPending}
      className="w-full"
    >
      <Bookmark className="mr-2 h-4 w-4" />
      {isPending ? 'Saving...' : 'Save This Search'}
    </Button>
  );
}