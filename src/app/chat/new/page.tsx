import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import { type Profile } from '@/types';
import Avatar from '@/app/components/Avatar';
import BackButton from '@/app/components/BackButton';
import StartChatButton from './StartChatButton';

export default async function NewMessagePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/?authModal=true');
    }

    // Fetch all profiles from the database, excluding the current user
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'eq', user.id)
        .order('username', { ascending: true });

    if (error) {
        return <p className="text-center p-4 text-red-500">Could not load users.</p>;
    }

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <div className="mb-6">
                <BackButton />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-6">Start a New Conversation</h1>
            <div className="bg-surface rounded-xl shadow-lg">
                <div className="divide-y divide-gray-200">
                    {(profiles as Profile[]).map((profile) => (
                        <div key={profile.id} className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Avatar src={profile.avatar_url} alt={profile.username || 'U'} size={40} />
                                <div>
                                    <p className="font-bold text-text-primary">{profile.username}</p>
                                    <p className="text-sm text-text-secondary">Joined on {new Date(profile.created_at || '').toLocaleDateString()}</p>
                                </div>
                            </div>
                            <StartChatButton recipient={profile} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}