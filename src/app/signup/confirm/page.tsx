import Link from 'next/link';
import { FaEnvelopeOpenText } from 'react-icons/fa';

export default function SignupConfirmPage() {
    return (
        <div className="container mx-auto max-w-md py-24 px-4 text-center">
            <div className="p-8 bg-surface rounded-xl shadow-lg">
                <FaEnvelopeOpenText className="mx-auto text-5xl text-brand mb-4" />
                <h1 className="text-3xl font-bold text-text-primary">Confirm your email</h1>
                <p className="text-text-secondary mt-2 mb-6">
                    We've sent a confirmation link to your email address. Please click the link to complete your registration.
                </p>
                <Link href="/" className="font-semibold text-brand hover:underline">
                    Return to Homepage
                </Link>
            </div>
        </div>
    );
}