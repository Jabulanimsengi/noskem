// File: app/auth/page.tsx

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

  const handleAuthAction = async () => {
    setError(null);

    // Common data for both account types
    const commonOptions = {
      data: {
        username: username,
        account_type: accountType,
      },
    };

    // Prepare the specific data based on account type
    const profileData = accountType === 'individual'
      ? { first_name: firstName, last_name: lastName }
      : { company_name: companyName };
    
    // Merge common and specific data
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
      // Sign In Logic remains the same
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
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">
          {isSigningUp ? 'Create an Account' : 'Sign In'}
        </h1>
        
        {/* Sign In / Sign Up Toggle */}
        <p className="text-center text-gray-400">
          {isSigningUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => setIsSigningUp(!isSigningUp)}
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            {isSigningUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {error && (
            <div className="p-3 text-center text-white bg-red-500 rounded-md">
                {error}
            </div>
        )}
        
        {/* The Form */}
        <div className="space-y-4">
          {/* Email and Password are always visible */}
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">Email address</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-300">Password</label>
            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>

          {/* Fields only visible during Sign Up */}
          {isSigningUp && (
            <>
              <hr className="border-gray-600" />
              {/* Account Type Toggle */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Account Type</label>
                <div className="flex bg-gray-700 rounded-md p-1">
                  <button type="button" onClick={() => setAccountType('individual')} className={`w-1/2 py-2 rounded-md transition-colors ${accountType === 'individual' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Individual</button>
                  <button type="button" onClick={() => setAccountType('business')} className={`w-1/2 py-2 rounded-md transition-colors ${accountType === 'business' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Business</button>
                </div>
              </div>

              {/* Username (for all accounts) */}
              <div>
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-300">Public Username</label>
                <input id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>

              {/* Dynamic Fields */}
              {accountType === 'individual' ? (
                <>
                  <div>
                    <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-300">First Name</label>
                    <input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-300">Last Name</label>
                    <input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="companyName" className="block mb-2 text-sm font-medium text-gray-300">Company Name</label>
                  <input id="companyName" type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Main Action Button */}
        <div>
          <button onClick={handleAuthAction} className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none">
            {isSigningUp ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}