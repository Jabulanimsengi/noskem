import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import VerificationForm from './VerificationForm';
import { type Profile } from '@/types';

const StatusDisplay = ({ status }: { status: string | null }) => {
    if (status === 'verified') {
        return (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-r-lg">
                <div className="flex items-center gap-4">
                    <FaCheckCircle className="h-8 w-8" />
                    <div>
                        <h3 className="text-xl font-bold">You are Verified!</h3>
                        <p>Buyers can now see a "Verified" badge on your profile and listings, increasing trust.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-r-lg">
                <div className="flex items-center gap-4">
                    <FaClock className="h-8 w-8" />
                    <div>
                        <h3 className="text-xl font-bold">Verification Pending</h3>
                        <p>Your documents have been submitted and are awaiting review by our team. This usually takes 1-2 business days.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'rejected') {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-r-lg">
                 <div className="flex items-center gap-4">
                    <FaTimesCircle className="h-8 w-8" />
                    <div>
                        <h3 className="text-xl font-bold">Verification Rejected</h3>
                        <p>Unfortunately, we could not verify your documents. Please check your email for more details and feel free to re-submit.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Default case: not_verified or null
    return <VerificationForm />;
};

export default async function VerificationPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/?authModal=true');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single();

  if (!profile) {
    notFound();
  }

  return (
    <div>
        <StatusDisplay status={profile.verification_status} />
        {profile.verification_status === 'rejected' && (
            <div className="mt-8">
                <VerificationForm />
            </div>
        )}
    </div>
  );
}