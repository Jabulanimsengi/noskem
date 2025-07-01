import { createAdminClient } from '@/app/utils/supabase/admin';
import VerificationActions from './VerificationActions';
import { type Profile } from '@/types';

type ProfileForVerification = Profile & {
    email?: string; // Add email from auth user
    verification_documents: any; // Add verification_documents to the type
};

export default async function AdminVerificationsPage() {
    const supabase = await createAdminClient(); // FIX: Added await

    // Fetch profiles that are pending verification
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'pending');
        
    if (profileError) {
        return <p className="text-red-500">Error fetching pending verifications: {profileError.message}</p>;
    }
    
    // Fetch all users from Supabase Auth to map emails to profiles
    let allUsers = [];
    let page = 1;
    const perPage = 1000; // Fetch 1000 users per page
    let usersData;

    do {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

        if (error) {
            return <p className="text-red-500">Error fetching users: {error.message}</p>;
        }

        allUsers.push(...data.users);
        usersData = data;
        page++;
    } while (usersData.users.length === perPage);


    const profilesWithEmail: ProfileForVerification[] = profiles.map(profile => {
        const authUser = allUsers.find(u => u.id === profile.id);
        return {
            ...profile,
            email: authUser?.email
        };
    });
    
    const getDocumentUrl = (path: string) => {
        return supabase.storage.from('verification-documents').getPublicUrl(path).data.publicUrl;
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Pending ID Verifications</h2>
            <div className="space-y-4">
                {profilesWithEmail.length > 0 ? (
                    profilesWithEmail.map(profile => {
                        const docs = profile.verification_documents as any;
                        return (
                            <div key={profile.id} className="bg-gray-50 border rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <p className="font-semibold text-text-primary">{profile.username}</p>
                                        <p className="text-sm text-text-secondary">{profile.email}</p>
                                        <div className="flex gap-4 mt-2">
                                            <a href={getDocumentUrl(docs.idDocumentPath)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand hover:underline">View ID</a>
                                            <a href={getDocumentUrl(docs.proofOfAddressPath)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand hover:underline">View Address Proof</a>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <VerificationActions userId={profile.id} />
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-center text-text-secondary py-8">There are no pending verifications.</p>
                )}
            </div>
        </div>
    );
}