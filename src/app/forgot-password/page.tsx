// src/app/forgot-password/page.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { requestPasswordResetAction } from './actions';
import { Button } from '@/app/components/Button';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Sending...' : 'Send Reset Link'}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordResetAction, {
    message: '',
    type: null,
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Forgot Your Password?
        </h1>
        <p className="text-center text-sm text-gray-600">
          No problem. Enter your email address below, and we'll send you a link to reset it.
        </p>
        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Email address"
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
        <div className="text-center">
          <Link href="/?authModal=true" className="text-sm text-brand hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
