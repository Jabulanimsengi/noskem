// src/app/components/AuthModal.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModal } from '@/context/AuthModalContext';
import { createClient } from '../utils/supabase/client';
import { FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { signInAction, type SignInState } from '../auth/actions';
import { useToast } from '@/context/ToastContext';
import { getGuestLikes, clearGuestLikes } from '@/utils/guestLikes';
import { mergeGuestLikesAction } from '@/app/likes/actions';
import { useRouter } from 'next/navigation';

const initialSignInState: SignInState = {};

function SubmitButton({ text, pendingText }: { text: string, pendingText: string }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400">
            {pending ? pendingText : text}
        </button>
    );
}

export default function AuthModal() {
    const { isOpen, closeModal } = useAuthModal();
    const supabase = createClient();
    const { showToast } = useToast();
    const router = useRouter();

    const [view, setView] = useState<'signIn' | 'mfa'>('signIn');
    const [signInState, signInFormAction] = useFormState(signInAction, initialSignInState);

    const processedActionId = useRef<string | null>(null);

    const [mfaCode, setMfaCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSuccessfulSignIn = useCallback(async () => {
        showToast('Signed in successfully!', 'success');

        const guestLikes = getGuestLikes();
        if (guestLikes.length > 0) {
            await mergeGuestLikesAction(guestLikes);
            clearGuestLikes();
        }

        closeModal();
        // This refresh is crucial for updating the server-side state of the UI.
        router.refresh();
    }, [showToast, closeModal, router]);

    useEffect(() => {
        if (signInState.mfaRequired) {
            setView('mfa');
        }
        if (signInState.error) {
            showToast(signInState.error, 'error');
        }
        if (signInState.success && signInState.actionId !== processedActionId.current) {
            processedActionId.current = signInState.actionId!;
            handleSuccessfulSignIn();
        }
    }, [signInState, showToast, handleSuccessfulSignIn]);

    // --- THIS IS THE FIX ---
    // This effect listens directly to Supabase auth events. It's a robust
    // way to ensure the UI refreshes exactly when a user signs in.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                handleSuccessfulSignIn();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, handleSuccessfulSignIn]);

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        try {
            const { data, error: factorError } = await supabase.auth.mfa.listFactors();
            if (factorError || !data?.totp?.[0]) {
                throw new Error(factorError?.message || 'Could not find an MFA factor.');
            }

            const factorId = data.totp[0].id;
            const { error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code: mfaCode,
            });

            if (error) throw error;

            // No need to call handleSuccessfulSignIn here anymore,
            // the onAuthStateChange listener will catch it.

        } catch (error) {
            const err = error as Error;
            showToast(err.message, 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setView('signIn'), 200);
        }
    }, [isOpen]);

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
                            {view === 'signIn' && (
                                <div>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-text-primary">Welcome Back!</h2>
                                        <p className="text-text-secondary mt-1">Sign in to continue to Noskem.</p>
                                    </div>
                                    <form action={signInFormAction} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="email-auth">Email Address</label>
                                            <input name="email" id="email-auth" type="email" required className="w-full px-3 py-2 border rounded-md" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="password-auth">Password</label>
                                            <input name="password" id="password-auth" type="password" required className="w-full px-3 py-2 border rounded-md" />
                                        </div>
                                        <SubmitButton text="Sign In" pendingText="Signing In..." />
                                    </form>
                                    
                                    <div className="text-center text-sm text-text-secondary mt-6 space-y-2">
                                        <p>
                                            Don&apos;t have an account?{' '}
                                            <Link href="/signup" onClick={closeModal} className="font-semibold text-brand hover:underline">
                                                Sign Up
                                            </Link>
                                        </p>
                                        <p>
                                            <Link href="/forgot-password" onClick={closeModal} className="font-semibold text-brand hover:underline">
                                                Forgot your password?
                                            </Link>
                                        </p>
                                    </div>
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
                                        <button type="submit" disabled={isVerifying} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400">
                                            {isVerifying ? "Verifying..." : "Verify"}
                                        </button>
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