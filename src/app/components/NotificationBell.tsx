'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { FaBell, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import { markNotificationsAsRead } from './actions';
import { type RealtimePostgresChangesPayload, type User } from '@supabase/supabase-js';

export type Notification = {
  id: number;
  profile_id: string; // The owner of the notification
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell({ serverNotifications }: { serverNotifications: Notification[] }) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState(serverNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Get the current user on the client side
  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };
    fetchUser();
  }, [supabase]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handleNewNotification = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      const newNotification = payload.new as Notification;
      // --- FIX ---
      // Only add the notification if it belongs to the currently logged-in user
      if (currentUser && newNotification.profile_id === currentUser.id) {
        setNotifications(current => [newNotification, ...current]);
      }
    };

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handleNewNotification)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUser]); // Rerun effect if user changes

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      markNotificationsAsRead(unreadIds);
      setNotifications(current => 
        current.map(n => unreadIds.includes(n.id) ? { ...n, is_read: true } : n)
      );
    }
  };
  
  return (
    <div className="relative">
      <button onClick={handleToggle} className="relative text-gray-500 hover:text-brand p-2">
        <FaBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-600 text-white text-xs font-bold ring-2 ring-surface flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
            className="absolute right-0 mt-2 w-80 bg-surface border border-gray-200 rounded-xl shadow-lg z-50"
        >
          <div className="p-3 font-bold text-text-primary border-b border-gray-200">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <Link key={n.id} href={n.link_url || '#'} className="block hover:bg-gray-100" onClick={() => setIsOpen(false)}>
                  <div className={`p-3 border-b border-gray-200 flex items-start gap-3 ${!n.is_read ? 'bg-brand/5' : ''}`}>
                    <div className="flex-shrink-0 mt-1">
                        <FaBell className={`h-5 w-5 ${!n.is_read ? 'text-brand' : 'text-gray-400'}`} />
                    </div>
                    <div>
                        <p className={`text-sm ${!n.is_read ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-text-secondary">
                  <FaCheckCircle className="mx-auto text-4xl text-gray-300 mb-2"/>
                  <p>You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}