'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModal, type AuthView } from '@/context/AuthModalContext';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '../utils/supabase/client';
import { FaTimes } from 'react-icons/fa';
import Link from 'next/link';

// FIX: This theme has been completely redesigned to match the site's aesthetic.
const customTheme = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: 'teal',
        brandAccent: '#0d9488', // A darker teal for hover
        brandButtonText: 'white',
        defaultButtonBackground: '#ffffff',
        defaultButtonBackgroundHover: '#f9fafb',
        defaultButtonBorder: '#d1d5db',
        defaultButtonText: '#374151',
        inputBorder: '#d1d5db',
        inputBorderHover: '#9ca3af',
        inputBorderFocus: 'teal',
        inputText: '#111827',
        inputLabelText: '#374151',
        inputPlaceholder: '#9ca3af',
        messageText: '#4b5563',
        messageTextDanger: '#ef4444',
        anchorTextColor: '#4b5563',
        anchorTextHoverColor: 'teal',
      },
      space: {
        spaceSmall: '4px',
        spaceMedium: '8px',
        spaceLarge: '16px',
      },
      radii: {
        borderRadiusButton: '0.5rem', // 8px
        inputBorderRadius: '0.5rem',
      },
      fonts: {
        bodyFontFamily: `Inter, sans-serif`,
        buttonFontFamily: `Inter, sans-serif`,
        inputFontFamily: `Inter, sans-serif`,
        labelFontFamily: `Inter, sans-serif`,
      },
    },
  },
};

export default function AuthModal() {
  const { isOpen, view, closeModal, openModal } = useAuthModal();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authModalParam = searchParams.get('authModal');
    if (authModalParam) {
      const viewToOpen: AuthView = authModalParam === 'sign_up' ? 'sign_up' : 'sign_in';
      openModal(viewToOpen);
    }
  }, [searchParams, openModal]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        closeModal();
        router.refresh();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, closeModal, router]);

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
            className="w-full max-w-sm bg-surface rounded-xl shadow-xl relative"
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close authentication modal"
            >
              <FaTimes size={20} />
            </button>
            
            <div className="p-8">
              <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">Welcome Back!</h2>
                  <p className="text-text-secondary mt-1">Sign in to continue to Noskem.</p>
              </div>

              <Auth
                  supabaseClient={supabase}
                  appearance={customTheme}
                  view="sign_in" // Modal is now for sign-in only
                  showLinks={true}
                  providers={[]}
                  redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}`}
              />
              <p className="text-center text-sm text-text-secondary mt-6">
                Don't have an account?{' '}
                <Link href="/signup" onClick={closeModal} className="font-semibold text-brand hover:underline">
                    Sign Up
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}