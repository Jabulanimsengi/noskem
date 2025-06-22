'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModal } from '@/context/AuthModalContext';
import { createClient } from '../utils/supabase/client';
import { FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { signInAction, type SignInState } from '../auth/actions';
import { useToast } from '@/context/ToastContext';

// Initial state for our sign-in action
const initialSignInState: SignInState = {};

// --- Custom Submit Button for our new form ---
function SubmitButton({ text, pendingText }: { text: string, pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400">
      {pending ? pendingText : text}
    </button>
  );
}

export default function AuthModal() {
  const { isOpen, closeModal, openModal } = useAuthModal();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // This state now controls which view we see: 'signIn' or 'mfa'
  const [view, setView] = useState<'signIn' | 'mfa'>('signIn');
  const [signInState, signInFormAction] = useActionState(signInAction, initialSignInState);
  
  // State for the MFA verification code
  const [mfaCode, setMfaCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // If the server action tells us MFA is required, switch the view
    if (signInState.mfaRequired) {
      setView('mfa');
    }
    // If there's an error from the server action, show a toast
    if (signInState.error) {
      showToast(signInState.error, 'error');
    }
  }, [signInState, showToast]);
  
  // This useEffect still handles opening the modal via URL param
  useEffect(() => {
    if (searchParams.get('authModal')) {
      openModal();
    }
  }, [searchParams, openModal]);

  // Function to handle the final MFA verification step
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    // Get the latest authenticator factor
    const { data, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError || !data?.totp?.[0]) {
        showToast(factorError?.message || 'Could not find an MFA factor. Please try logging in again.', 'error');
        setView('signIn'); // Reset to the sign-in view
        setIsVerifying(false);
        return;
    }

    const factorId = data.totp[0].id;
    const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: mfaCode,
    });
    
    setIsVerifying(false);
    if (error) {
        showToast(error.message, 'error');
    } else {
        closeModal();
        router.refresh(); // Refresh the page to update auth state
    }
  };
  
  // When closing the modal, always reset the view to the default
  const handleClose = () => {
    setView('signIn');
    closeModal();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
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
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Close authentication modal"
            >
              <FaTimes size={20} />
            </button>
            
            <div className="p-8">
                {/* --- CONDITIONAL UI RENDERING --- */}

                {view === 'signIn' && (
                  <div>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-text-primary">Welcome Back!</h2>
                      <p className="text-text-secondary mt-1">Sign in to continue to Noskem.</p>
                    </div>
                    <form action={signInFormAction} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="email">Email Address</label>
                        <input name="email" id="email" type="email" required className="w-full px-3 py-2 border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="password">Password</label>
                        <input name="password" id="password" type="password" required className="w-full px-3 py-2 border rounded-md" />
                      </div>
                      <SubmitButton text="Sign In" pendingText="Signing In..." />
                    </form>
                    <p className="text-center text-sm text-text-secondary mt-6">
                      Don't have an account?{' '}
                      <Link href="/signup" onClick={closeModal} className="font-semibold text-brand hover:underline">
                          Sign Up
                      </Link>
                    </p>
                  </div>
                )}

                {view === 'mfa' && (
                   <div>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-text-primary">Enter Verification Code</h2>
                      <p className="text-text-secondary mt-1">Enter the 6-digit code from your authenticator app.</p>
                    </div>
                    <form onSubmit={handleMfaVerify} className="space-y-4">
                        <input
                            type="text"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            required
                            className="w-full text-center tracking-[0.5em] text-2xl p-2 border rounded-md"
                        />
                        <SubmitButton text="Verify" pendingText="Verifying..." />
                    </form>
                    <button onClick={() => setView('signIn')} className="text-center text-sm text-text-secondary mt-6 w-full hover:underline">
                        Back to login
                    </button>
                   </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}