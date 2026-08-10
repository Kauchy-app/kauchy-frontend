"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { notifications, unreadCount, markRead, markAllRead, deleteNotification, clearAll } = useNotifications();

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Bell size={48} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign in to view notifications</h2>
                <Link href="/signup" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">
                    Sign In
                </Link>
            </div>
        );
    }

    const handleNotificationClick = (notif: any) => {
        markRead(notif.id);
        if (notif.link) router.push(notif.link);
        else if (notif.notification_type === 'message') router.push('/chat');
        else if (notif.notification_type === 'order') router.push('/orders');
    };

    return (
        <div className="max-w-3xl mx-auto w-full px-4 py-6 md:py-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-bold rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-4">
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                            Mark all read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button onClick={clearAll} className="flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Clear all</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Bell size={32} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">You're all caught up!</h3>
                        <p className="text-gray-500 dark:text-gray-400">No new notifications right now.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`group relative p-5 flex items-start gap-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50 ${
                                    notif.is_read ? 'opacity-70' : 'bg-blue-50/30 dark:bg-blue-900/10'
                                }`}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]'}`} />
                                
                                <div className="flex-1 min-w-0 pr-8">
                                    <h4 className={`text-sm font-bold mb-1 ${notif.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                        {notif.title}
                                    </h4>
                                    <p className={`text-sm mb-2 leading-relaxed ${notif.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {notif.message}
                                    </p>
                                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                        {new Date(notif.created_at).toLocaleString(undefined, { 
                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                                        })}
                                    </span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notif.id);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-red-500 transition-all focus:opacity-100"
                                    title="Delete notification"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
