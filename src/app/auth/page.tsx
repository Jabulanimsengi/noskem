'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuthAction = async () => {
    setError(null);

    let authResponse;
    if (isSigningUp) {
      // Sign Up Logic
      authResponse = await supabase.auth.signUp({
        email,
        password,
      });
    } else {
      // Sign In Logic
      authResponse = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    const { data, error } = authResponse;

    if (error) {
      setError(error.message);
    } else {
      // On success, redirect the user to the homepage.
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">
          {isSigningUp ? 'Create an Account' : 'Sign In'}
        </h1>
        <p className="text-center text-gray-400">
          {isSigningUp
            ? 'Already have an account? '
            : "Don't have an account? "}
          <button
            onClick={() => {
                setIsSigningUp(!isSigningUp);
                setError(null);
            }}
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

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <button
            onClick={handleAuthAction}
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
          >
            {isSigningUp ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
