// src/app/components/PasswordStrength.tsx
'use client';

import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface PasswordStrengthProps {
  password?: string;
}

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
    {met ? <FaCheckCircle className="mr-2" /> : <FaTimesCircle className="mr-2" />}
    <span>{text}</span>
  </div>
);

export default function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return (
    <div className="space-y-1 mt-2">
      <PasswordRequirement met={hasMinLength} text="At least 8 characters" />
      <PasswordRequirement met={hasLowercase} text="Contains a lowercase letter" />
      <PasswordRequirement met={hasUppercase} text="Contains an uppercase letter" />
      <PasswordRequirement met={hasNumber} text="Contains a number" />
    </div>
  );
}
