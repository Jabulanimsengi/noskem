'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../utils/supabase/client';
import { FaBell, FaCheckCircle, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { markNotificationsAsRead, toggleNotificationReadStatus, clearAllNotifications } from '@/app/actions';
import { useToast } from '@/context/ToastContext';
import { type RealtimePostgresChangesPayload, type User } from '@supabase/supabase-js';

export type Notification = {
  id: number;
  profile_id: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

// This component no longer accepts props. It handles all of its own data.
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { showToast } = useToast();
  const supabase = createClient();

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const fetchInitialNotifications = useCallback(async (user: User) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  }, [supabase]);

  // This effect runs once to get the user and their initial notifications
  useEffect(() => {
    const getUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchInitialNotifications(user);
      }
    };
    getUserAndNotifications();
  }, [supabase, fetchInitialNotifications]);

  // This effect listens for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const handleNewNotification = (payload: RealtimePostgresChangesPayload<Notification>) => {
      if (payload.new && 'profile_id' in payload.new) {
        if (payload.new.profile_id === currentUser.id) {
          setNotifications(current => [payload.new as Notification, ...current]);
        }
      }
    };

    const channel = supabase
      .channel('public:notifications')
      .on<Notification>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handleNewNotification)
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [currentUser, supabase]); // Depend on supabase client

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      markNotificationsAsRead(unreadIds);
      setNotifications(current => 
        current.map(n => unreadIds.includes(n.id) ? { ...n, is_read: true } : n)
      );
    }
  };
  
  const handleToggleReadStatus = async (e: React.MouseEvent, notificationId: number, currentStatus: boolean) => {
    e.stopPropagation(); e.preventDefault();
    const newStatus = !currentStatus;
    setNotifications(current => 
      current.map(n => n.id === notificationId ? { ...n, is_read: newStatus } : n)
    );
    try { await toggleNotificationReadStatus(notificationId, newStatus); } 
    catch (error: any) {
      showToast(error.message, 'error');
      setNotifications(current => 
        current.map(n => n.id === notificationId ? { ...n, is_read: currentStatus } : n)
      );
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentNotifications = [...notifications];
    setNotifications([]);
    try {
      await clearAllNotifications();
      showToast('Notifications cleared.', 'success');
      setIsOpen(false);
    } catch (error: any) {
      showToast(error.message, 'error');
      setNotifications(currentNotifications);
    }
  };
  
  // Don't render the bell at all if no user is logged in.
  if (!currentUser) {
    return null; 
  }
  
  return (
    <div className="relative">
        <button onClick={handleToggleDropdown} className="relative text-gray-500 hover:text-brand p-2">
            <FaBell size={22} />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-600 text-white text-xs font-bold ring-2 ring-surface flex items-center justify-center">
                    {unreadCount}
                </span>
            )}
        </button>

        {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-gray-200 rounded-xl shadow-lg z-50">
                <div className="p-3 flex justify-between items-center border-b border-gray-200">
                    <span className="font-bold text-text-primary">Notifications</span>
                    {notifications.length > 0 && (
                    <button onClick={handleClearAll} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                        <FaTrash />
                        Clear All
                    </button>
                    )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                    notifications.map(n => (
                        <Link key={n.id} href={n.link_url || '#'} className="flex items-start gap-3 p-3 border-b last:border-b-0 border-gray-100 hover:bg-gray-100" onClick={() => setIsOpen(false)}>
                            <div className="flex-shrink-0 mt-1">
                                <FaBell className={`h-5 w-5 ${!n.is_read ? 'text-brand' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-grow">
                                <p className={`text-sm ${!n.is_read ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(n.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex-shrink-0 ml-2 self-center">
                                <button 
                                    onClick={(e) => handleToggleReadStatus(e, n.id, n.is_read)}
                                    title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                                    className="p-1 rounded-full"
                                >
                                    {n.is_read ? (
                                    <div className="w-3 h-3 rounded-full bg-transparent border-2 border-gray-300"></div>
                                    ) : (
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    )}
                                </button>
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