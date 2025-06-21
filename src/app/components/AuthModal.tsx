'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModal, type AuthView } from '@/context/AuthModalContext';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '../utils/supabase/client';

export default function AuthModal() {
  const { isOpen, view, closeModal, openModal, switchTo } = useAuthModal();
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authModalParam = searchParams.get('authModal');
    if (authModalParam) {
      // FIX: Check for the correct 'sign_up' value
      const viewToOpen: AuthView = authModalParam === 'sign_up' ? 'sign_up' : 'sign_in';
      openModal(viewToOpen);
    }
  }, [searchParams, openModal]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <div className="bg-surface p-8 rounded-lg shadow-xl">
                {/* This component can be replaced with your own custom form if needed */}
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    view={view}
                    showLinks={true}
                    providers={['google']}
                    theme="dark"
                    redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}`}
                />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}