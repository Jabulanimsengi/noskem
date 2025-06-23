'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { FaBell, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
// FIX: Import the new server action
import { markNotificationsAsRead, toggleNotificationReadStatus } from '@/app/actions';
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

export default function NotificationBell({ serverNotifications }: { serverNotifications: Notification[] }) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState(serverNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    setNotifications(serverNotifications);
  }, [serverNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!currentUser) return;

    const handleNewNotification = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      const newNotification = payload.new as Notification;
      if (newNotification.profile_id === currentUser.id) {
        setNotifications(current => [newNotification, ...current]);
      }
    };

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handleNewNotification)
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [currentUser]);

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
  
  // FIX: New handler to toggle a single notification's read status
  const handleToggleReadStatus = async (e: React.MouseEvent, notificationId: number, currentStatus: boolean) => {
    // Prevent the click from navigating to the link's href
    e.stopPropagation();
    e.preventDefault();

    const newStatus = !currentStatus;

    // Optimistic UI Update: Instantly change the UI
    setNotifications(current => 
      current.map(n => n.id === notificationId ? { ...n, is_read: newStatus } : n)
    );

    // Call the server action to update the database in the background
    try {
      await toggleNotificationReadStatus(notificationId, newStatus);
    } catch (error: any) {
      showToast(error.message, 'error');
      // If the server update fails, revert the UI change
      setNotifications(current => 
        current.map(n => n.id === notificationId ? { ...n, is_read: currentStatus } : n)
      );
    }
  };
  
  return (
    <div className="relative">
      <button onClick={handleToggleDropdown} className="relative text-gray-500 hover:text-brand p-2">
        <FaBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-600 text-white text-xs font-bold ring-2 ring-surface flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="p-3 font-bold text-text-primary border-b border-gray-200">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <Link key={n.id} href={n.link_url || '#'} className={`flex items-start gap-3 p-3 border-b border-gray-200 hover:bg-gray-100 ${!n.is_read ? 'bg-brand/5' : ''}`} onClick={() => setIsOpen(false)}>
                    <div className="flex-shrink-0 mt-1">
                        <FaBell className={`h-5 w-5 ${!n.is_read ? 'text-brand' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-grow">
                        <p className={`text-sm ${!n.is_read ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                    </div>
                    {/* FIX: Add the toggle button */}
                    <div className="flex-shrink-0 ml-2">
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