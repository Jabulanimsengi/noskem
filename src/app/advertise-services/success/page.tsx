import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function AdvertiseSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">Application Submitted!</h1>
      <p className="text-lg text-gray-600 mb-6">
        Thank you. Your application is now pending review from our team.
      </p>
      <Link
        href="/account/dashboard"
        className="px-6 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}