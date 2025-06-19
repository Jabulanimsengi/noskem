// File: src/app/auth/page.tsx

'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';

// Define the account types
type AccountType = 'individual' | 'business';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  // State for auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(true); // Default to sign up
  
  // State for profile data
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async () => {
    setError(null);
    setIsLoading(true);

    const commonOptions = {
      data: {
        username: username,
        account_type: accountType,
      },
    };

    const profileData = accountType === 'individual'
      ? { first_name: firstName, last_name: lastName }
      : { company_name: companyName };
    
    const finalOptions = {
        ...commonOptions,
        data: { ...commonOptions.data, ...profileData }
    };

    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: finalOptions,
      });

      if (error) {
        setError(error.message);
      } else {
        alert("Sign up successful! Please check your email for a confirmation link.");
        router.push('/');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-12 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-text-primary">
          {isSigningUp ? 'Create an Account' : 'Sign In'}
        </h1>
        
        <p className="text-center text-text-secondary">
          {isSigningUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => setIsSigningUp(!isSigningUp)}
            className="font-medium text-brand hover:text-brand-dark"
          >
            {isSigningUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {error && (
            <div className="p-3 text-center text-white bg-red-500 rounded-md">
                {error}
            </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-text-secondary">Email address</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"/>
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-text-secondary">Password</label>
            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"/>
          </div>

          {isSigningUp && (
            <>
              <hr className="border-gray-200" />
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Account Type</label>
                <div className="flex bg-background rounded-md p-1">
                  <button type="button" onClick={() => setAccountType('individual')} className={`w-1/2 py-2 rounded-md transition-colors ${accountType === 'individual' ? 'bg-brand text-white' : 'text-text-secondary'}`}>Individual</button>
                  <button type="button" onClick={() => setAccountType('business')} className={`w-1/2 py-2 rounded-md transition-colors ${accountType === 'business' ? 'bg-brand text-white' : 'text-text-secondary'}`}>Business</button>
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-text-secondary">Public Username</label>
                <input id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"/>
              </div>

              {accountType === 'individual' ? (
                <>
                  <div>
                    <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-text-secondary">First Name</label>
                    <input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"/>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-text-secondary">Last Name</label>
                    <input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"/>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="companyName" className="block mb-2 text-sm font-medium text-text-secondary">Company Name</label>
                  <input id="companyName" type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"/>
                </div>
              )}
            </>
          )}
        </div>
        
        <div>
          <button onClick={handleAuthAction} disabled={isLoading} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark focus:outline-none transition-all shadow-md hover:shadow-lg disabled:bg-gray-400">
            {isLoading ? 'Processing...' : (isSigningUp ? 'Create Account' : 'Sign In')}
          </button>
        </div>
      </div>
    </div>
  );
}
