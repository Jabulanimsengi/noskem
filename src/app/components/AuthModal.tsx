'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModal, type AuthView } from '@/context/AuthModalContext';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '../utils/supabase/client';

// Custom theme to align the Supabase Auth UI with the site's design.
const customTheme = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: 'teal',
        brandAccent: '#0d9488',
        brandButtonText: 'white',
        defaultButtonBackground: 'white',
        defaultButtonBackgroundHover: '#f9fafb',
        inputBorder: '#d1d5db',
        inputBorderHover: '#9ca3af',
        inputBorderFocus: 'teal',
        inputText: '#111827',
        inputBackground: 'white',
        inputLabelText: '#374151',
        inputPlaceholder: '#9ca3af',
        messageText: '#4b5563',
        messageTextDanger: '#ef4444',
        anchorTextColor: '#4b5563',
        anchorTextHoverColor: 'teal',
      },
      radii: {
        borderRadiusButton: '0.5rem',
        inputBorderRadius: '0.5rem',
      },
      fonts: {
        bodyFontFamily: 'Inter, sans-serif',
        buttonFontFamily: 'Inter, sans-serif',
        inputFontFamily: 'Inter, sans-serif',
        labelFontFamily: 'Inter, sans-serif',
      },
    },
  },
};

export default function AuthModal() {
  const { isOpen, view, closeModal, openModal } = useAuthModal();
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authModalParam = searchParams.get('authModal');
    if (authModalParam) {
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
                <Auth
                    supabaseClient={supabase}
                    appearance={customTheme}
                    view={view}
                    showLinks={true}
                    providers={[]}
                    redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}`}
                />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}