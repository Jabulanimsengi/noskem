// File: app/account/dashboard/notifications/page.tsx

import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FaBell } from 'react-icons/fa';

type Notification = {
    id: number;
    message: string;
    link_url: string | null;
    is_read: boolean;
    created_at: string;
};

export default async function NotificationsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching notifications:", error.message);
        return <p className="text-red-500 p-4">Could not load notifications.</p>;
    }

    const notifications: Notification[] = data || [];

    return (
        <div>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">All Notifications</h2>
            
            <div className="space-y-3">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <Link 
                            key={notification.id} 
                            href={notification.link_url || '#'}
                            className="block"
                        >
                            <div className={`
                                p-4 rounded-md transition-colors flex items-start gap-4 border
                                ${notification.is_read 
                                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                                    : 'bg-brand/10 border-brand/50 hover:bg-brand/20 border-l-4 border-l-brand'
                                }
                            `}>
                                <FaBell className={`mt-1 flex-shrink-0 ${notification.is_read ? 'text-gray-400' : 'text-brand'}`} />
                                <div>
                                    <p className={`text-sm ${notification.is_read ? 'text-text-secondary' : 'text-text-primary font-semibold'}`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(notification.created_at).toLocaleString('en-ZA', { 
                                            day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' 
                                        })}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-12 text-text-secondary">
                        <FaBell className="mx-auto text-4xl mb-4" />
                        <p>You have no notifications yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
