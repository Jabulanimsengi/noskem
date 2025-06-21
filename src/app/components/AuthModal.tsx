'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/Button';
import { useAuthModal } from '@/context/AuthModalContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';

type AccountType = 'individual' | 'business';

const AuthForm = () => {
    const router = useRouter();
    const supabase = createClient();
    
    // FIX: Use the correct names 'view' and 'switchTo' from the context
    const { view, switchTo, closeModal } = useAuthModal();
    
    // FIX: Use the correct name 'showToast' from the context
    const { showToast } = useToast();
    const { showLoader } = useLoading();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accountType, setAccountType] = useState<AccountType>('individual');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);


    const handleAuthAction = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (view === 'signUp') {
                const profileData = accountType === 'individual' ? { first_name: firstName, last_name: lastName } : { company_name: companyName };
                const { error: signUpError } = await supabase.auth.signUp({
                    email, password,
                    options: { data: { username, account_type: accountType, ...profileData } },
                });
                if (signUpError) throw signUpError;
                // FIX: Call 'showToast' instead of 'addToast'
                showToast('Sign up successful! Please check your email.', 'success');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
                // FIX: Call 'showToast' instead of 'addToast'
                showToast("Welcome back! You've successfully signed in.", 'success');
            }
            
            closeModal();
            showLoader(); 
            // FIX: Use router.push('/') for a cleaner navigation than refresh()
            router.push('/');

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setIsLoading(false); 
        }
    };
    
    const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
    
    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-xl shadow-lg">
            {/* FIX: Check for 'view' instead of 'mode' */}
            {view === 'signUp' ? (
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-text-primary">Create an Account</h1>
                    <p className="text-text-secondary mt-2">
                        Already have an account?{' '}
                        {/* FIX: Call 'switchTo' instead of 'switchMode' */}
                        <button onClick={() => switchTo('signIn')} className="font-medium text-brand hover:text-brand-dark">Sign In</button>
                    </p>
                </div>
            ) : (
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-text-primary">Sign In</h1>
                    <p className="text-text-secondary mt-2">
                        Don't have an account?{' '}
                        {/* FIX: Call 'switchTo' instead of 'switchMode' */}
                        <button onClick={() => switchTo('signUp')} className="font-medium text-brand hover:text-brand-dark">Sign Up</button>
                    </p>
                </div>
            )}
            
            {error && <div className="p-3 my-2 text-center text-white bg-red-500 rounded-md">{error}</div>}
            
            <form onSubmit={(e) => { e.preventDefault(); handleAuthAction(); }} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Email address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles}/>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles}/>
              </div>

              {/* FIX: Check for 'view' instead of 'mode' */}
              {view === 'signUp' && (
                <>
                  <hr className="border-gray-200 pt-4" />
                  <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary">Account Type</label>
                    <div className="flex bg-gray-200 rounded-md p-1">
                      <button type="button" onClick={() => setAccountType('individual')} className={`w-1/2 py-2 rounded-md transition-colors ${accountType === 'individual' ? 'bg-brand text-white shadow' : 'text-text-secondary'}`}>Individual</button>
                      <button type="button" onClick={() => setAccountType('business')} className={`w-1/2 py-2 rounded-md transition-colors ${accountType === 'business' ? 'bg-brand text-white shadow' : 'text-text-secondary'}`}>Business</button>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary">Public Username</label>
                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className={inputStyles}/>
                  </div>
                  {accountType === 'individual' ? (
                    <>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-text-secondary">First Name</label>
                        <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputStyles}/>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-text-secondary">Last Name</label>
                        <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputStyles}/>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-text-secondary">Company Name</label>
                      <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputStyles}/>
                    </div>
                  )}
                </>
              )}
              <div className="pt-2">
                <Button type="submit" disabled={isLoading} className="w-full shadow-md hover:shadow-lg">
                  {isLoading ? 'Processing...' : (view === 'signUp' ? 'Create Account' : 'Sign In')}
                </Button>
              </div>
            </form>
        </div>
    );
};

export default function AuthModal() {
    const { isOpen, closeModal } = useAuthModal();
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
                    >
                        <AuthForm />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}