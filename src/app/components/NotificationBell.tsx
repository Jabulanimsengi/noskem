// File: app/components/NotificationBell.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { FaBell } from 'react-icons/fa';
import Link from 'next/link';
import { markNotificationsAsRead } from './actions';
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the shape of a notification
export type Notification = {
  id: number;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

// This component takes the initial list of notifications from the server.
export default function NotificationBell({ serverNotifications }: { serverNotifications: Notification[] }) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState(serverNotifications);
  const [isOpen, setIsOpen] = useState(false);

  // Calculate the count of unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Handle real-time updates
  useEffect(() => {
    const handleNewNotification = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      // Add the new notification to the top of the list
      setNotifications(current => [payload.new as Notification, ...current]);
    };

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        handleNewNotification
      )
      .subscribe();

    // Clean up the subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // When the bell is clicked, toggle the dropdown
  const handleToggle = () => {
    setIsOpen(!isOpen);
    // If opening the dropdown and there are unread notifications, mark them as read.
    if (!isOpen && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      markNotificationsAsRead(unreadIds);
      
      // Optimistically update the UI to show them as read immediately
      setNotifications(current => 
        current.map(n => unreadIds.includes(n.id) ? { ...n, is_read: true } : n)
      );
    }
  };
  
  return (
    <div className="relative">
      <button onClick={handleToggle} className="relative text-gray-300 hover:text-white p-2">
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-600 text-white text-xs font-bold ring-2 ring-gray-800">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-3 font-bold text-white border-b border-gray-600">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <Link key={n.id} href={n.link_url || '#'}>
                  <div className={`p-3 border-b border-gray-600 hover:bg-gray-600 ${!n.is_read ? 'font-bold' : ''}`}>
                    <p className="text-sm text-white">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-400">You have no notifications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}