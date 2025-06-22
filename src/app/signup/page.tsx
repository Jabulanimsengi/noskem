'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signupAction, type SignupFormState } from './actions';
import Link from 'next/link';

const initialState: SignupFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400">
      {pending ? 'Creating Account...' : 'Create Account'}
    </button>
  );
}

export default function SignUpPage() {
  const [state, formAction] = useActionState(signupAction, initialState);
  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual');

  const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      <div className="p-8 bg-surface rounded-xl shadow-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-text-primary">Create Your Account</h1>
        <form action={formAction} className="space-y-4">
          
          {/* Account Type Selector */}
          <div>
            <label className={labelStyles}>Account Type</label>
            <div className="flex gap-2 rounded-lg p-1 bg-gray-100">
              <input type="radio" id="individual" name="accountType" value="individual" checked={accountType === 'individual'} onChange={() => setAccountType('individual')} className="hidden" />
              <label htmlFor="individual" className={`flex-1 text-center px-4 py-2 rounded-md cursor-pointer text-sm font-semibold ${accountType === 'individual' ? 'bg-white text-brand shadow' : 'text-text-secondary'}`}>Individual</label>

              <input type="radio" id="business" name="accountType" value="business" checked={accountType === 'business'} onChange={() => setAccountType('business')} className="hidden" />
              <label htmlFor="business" className={`flex-1 text-center px-4 py-2 rounded-md cursor-pointer text-sm font-semibold ${accountType === 'business' ? 'bg-white text-brand shadow' : 'text-text-secondary'}`}>Business</label>
            </div>
          </div>

          {/* Conditional Fields */}
          {accountType === 'individual' ? (
            <>
              <div><label htmlFor="firstName" className={labelStyles}>First Name</label><input id="firstName" name="firstName" type="text" required className={inputStyles}/></div>
              <div><label htmlFor="lastName" className={labelStyles}>Last Name</label><input id="lastName" name="lastName" type="text" required className={inputStyles}/></div>
            </>
          ) : (
            <>
              <div><label htmlFor="companyName" className={labelStyles}>Company Name</label><input id="companyName" name="companyName" type="text" required className={inputStyles}/></div>
              <div><label htmlFor="companyRegistration" className={labelStyles}>Company Registration (Optional)</label><input id="companyRegistration" name="companyRegistration" type="text" className={inputStyles}/></div>
            </>
          )}

          <hr className="my-4"/>

          {/* Core Fields */}
          <div><label htmlFor="email" className={labelStyles}>Email Address</label><input id="email" name="email" type="email" required className={inputStyles}/></div>
          <div><label htmlFor="username" className={labelStyles}>Username</label><input id="username" name="username" type="text" required className={inputStyles}/></div>
          <div><label htmlFor="password" className={labelStyles}>Password</label><input id="password" name="password" type="password" required className={inputStyles}/></div>
          <div><label htmlFor="confirmPassword" className={labelStyles}>Confirm Password</label><input id="confirmPassword" name="confirmPassword" type="password" required className={inputStyles}/></div>
          
          {state.error && <div className="p-3 text-center text-white bg-red-500 rounded-md text-sm">{state.error}</div>}

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/?authModal=sign_in" className="font-semibold text-brand hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}