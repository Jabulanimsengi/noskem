// src/app/admin/verifications/page.tsx

import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import VerificationActions from './VerificationActions';
import { type Profile } from '@/types';

// This function fetches all users with a 'pending' verification status
async function getPendingVerifications() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('verification_status', 'pending');

  if (error) {
    console.error('Error fetching pending verifications:', error);
    return [];
  }
  return data as Profile[];
}

export default async function AdminVerificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Security check to ensure only admins can access this page
  if (!user) return notFound();
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (adminProfile?.role !== 'admin') return notFound();

  const pendingUsers = await getPendingVerifications();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">ID Verifications</h1>
      {pendingUsers.length === 0 ? (
        <p className="text-gray-500">No users are currently pending verification.</p>
      ) : (
        <div className="space-y-6">
          {pendingUsers.map((profile) => (
            <div key={profile.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold">{profile.username}</h2>
                  <p className="text-sm text-gray-600">{profile.first_name} {profile.last_name}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  {/* The Approve/Reject buttons are in this component */}
                  <VerificationActions profileId={profile.id} />
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold mb-2">Submitted Documents</h3>
                {/* This safely checks for and displays the uploaded documents */}
                {profile.verification_documents && Array.isArray(profile.verification_documents) && profile.verification_documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.verification_documents.map((doc: any, index: number) => (
                      <a key={index} href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
                        <Image
                          src={doc.url}
                          alt={`Document ${index + 1}`}
                          width={200}
                          height={150}
                          className="rounded-md object-cover w-full h-32 hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No documents submitted.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}