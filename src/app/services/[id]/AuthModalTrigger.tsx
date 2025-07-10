'use client'

import { useAuthModal } from '../../../context/AuthModalContext'

export default function AuthModalTrigger() {
  const { openModal } = useAuthModal()

  return (
    <div className="mt-4 text-center">
      <p className="text-sm text-gray-500">
        You must be logged in to see full contact details.
      </p>
      <button
        // Corrected: Wrap openModal in an arrow function to provide the required 'sign_in' view.
        onClick={() => openModal('sign_in')}
        className="mt-2 w-full font-semibold text-brand hover:underline"
      >
        Log In or Sign Up
      </button>
    </div>
  )
}