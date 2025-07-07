// src/app/reset-password/page.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updatePasswordAction } from './actions';
import { Button } from '@/app/components/Button';
import Link from 'next/link';
import { Suspense } from 'react';
import PasswordStrength from '@/app/components/PasswordStrength';
import { useState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Resetting...' : 'Reset Password'}
    </Button>
  );
}

// Wrap the component in Suspense because it uses useSearchParams
function ResetPasswordFormComponent() {
  const [password, setPassword] = useState('');
  const [state, formAction] = useFormState(updatePasswordAction, {
    message: '',
    type: null,
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Choose a New Password
        </h1>
        <form action={formAction} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <PasswordStrength password={password} />

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <SubmitButton />

          {state.message && (
            <p
              className={`text-sm text-center ${
                state.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {state.message}
            </p>
          )}
        </form>
        {state.type === 'success' && (
           <div className="text-center">
             <Link href="/?authModal=true" className="text-sm text-brand hover:underline">
               Back to Sign In
             </Link>
           </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordFormComponent />
        </Suspense>
    )
}
