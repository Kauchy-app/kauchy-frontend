"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function NotificationBell({ collapsed = true }: { collapsed?: boolean }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const { unreadCount } = useNotifications();

    if (!user) return null;

    const itemBase = 'relative flex items-center gap-4 rounded-xl h-12 px-3 transition-colors w-full';
    const active = pathname === '/notifications';

    return (
        <Link
            href="/notifications"
            title="Notifications"
            className={`${itemBase} ${active ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
        >
            <span className="relative shrink-0">
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full border border-white dark:border-black">
                        {unreadCount}
                    </span>
                )}
            </span>
            <span className="whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Notifications
            </span>
        </Link>
    );
}
