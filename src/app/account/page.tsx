"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { AuthWall } from '@/context/AuthGateContext';
import { useUserData } from '@/context/UserDataContext';
import { useTheme } from 'next-themes';
import { User, Package, Boxes, BarChart2, Wallet, Moon, Sun, LogOut, ChevronRight, ListTodo } from 'lucide-react';
import { formatNairaFixed } from '@/utils/formatCurrency';

export default function AccountPage() {
    const { user, logout, loading } = useAuth();
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const currentTheme = theme === 'system' ? systemTheme : theme;

    const { walletBalance, profile } = useUserData();
    const [ordersCount, setOrdersCount] = useState<number | null>(null);

    const isVendor = (user?.user?.role || user?.role || '').toLowerCase() === 'vendor';

    useEffect(() => {
        if (!user?.access) return;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.access}`,
        };

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my_orders/`, { headers })
            .then(r => (r.ok ? r.json() : null))
            .then(d => { if (Array.isArray(d)) setOrdersCount(d.length); })
            .catch(() => {});
    }, [user]);

    if (!user) {
        return <AuthWall reason="view your account" loading={loading} />;
    }

    const username = profile?.username || user?.user?.username || user?.username || 'User';
    const role = profile?.role || user?.user?.role || user?.role || '';
    const avatar = profile?.profile_url || profile?.pfp || '/placeholder.svg';

    const links = [
        { href: '/profile', label: 'Edit Profile', sub: 'Name, bio, photo & more', icon: User, show: true },
        { href: '/orders', label: 'My Orders', sub: 'Track your purchases', icon: Package, show: true },
        { href: '/requests', label: 'Product Requests', sub: 'See what customers are looking for', icon: ListTodo, show: true },
        { href: '/inventory', label: 'My Inventory', sub: 'Manage your listings', icon: Boxes, show: isVendor },
        { href: '/analytics', label: 'Analytics', sub: 'Sales & performance', icon: BarChart2, show: isVendor },
    ].filter(l => l.show);

    return (
        <main className="relative min-h-[calc(100dvh-135px)] md:min-h-screen chat-bg overflow-hidden">
            <div className="relative max-w-[640px] mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5">
                {/* Identity header */}
                <div className="relative rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-sm">
                    <div className="h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 relative">
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(600px_200px_at_20%_0%,rgba(255,255,255,0.4),transparent_60%)]" />
                    </div>
                    <div className="relative z-10 px-6 pb-6 -mt-12 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white dark:ring-zinc-900 bg-gray-100 dark:bg-zinc-800 shadow-lg">
                            <Image src={avatar} alt={username} width={96} height={96} className="w-full h-full object-cover" />
                        </div>
                        <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{username}</h1>
                        {role && (
                            <span className="inline-block mt-1.5 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-400/20 px-3 py-0.5 rounded-full text-xs font-semibold capitalize">
                                {role}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                            {ordersCount === null ? '—' : ordersCount}
                        </p>
                        <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Orders</p>
                    </div>
                    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                            {formatNairaFixed(walletBalance)}
                        </p>
                        <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Balance</p>
                    </div>
                </div>

                {/* Wallet */}
                <Link
                    href="/wallet"
                    className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-white/85">Wallet Balance</p>
                            <p className="text-lg font-bold leading-tight">{formatNairaFixed(walletBalance)}</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-white/85 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* Account links */}
                <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl overflow-hidden">
                    {links.map((l, i) => {
                        const Icon = l.icon;
                        return (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={`flex items-center gap-3.5 px-4 py-3.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors ${i !== 0 ? 'border-t border-black/5 dark:border-white/[0.08]' : ''}`}
                            >
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center shrink-0">
                                    <Icon size={18} className="text-indigo-600 dark:text-indigo-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{l.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{l.sub}</p>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 shrink-0" />
                            </Link>
                        );
                    })}

                    {/* Dark mode toggle */}
                    <div className="flex items-center gap-3.5 px-4 py-3.5 border-t border-black/5 dark:border-white/[0.08]">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center shrink-0">
                            {mounted && currentTheme === 'dark'
                                ? <Sun size={18} className="text-amber-500" />
                                : <Moon size={18} className="text-indigo-600 dark:text-indigo-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Dark Mode</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Switch the app appearance</p>
                        </div>
                        {mounted && (
                            <button
                                onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                                role="switch"
                                aria-checked={currentTheme === 'dark'}
                                aria-label="Toggle dark mode"
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${currentTheme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${currentTheme === 'dark' ? 'translate-x-5' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-red-500/15 bg-red-500/10 dark:bg-red-500/[0.08] text-red-600 dark:text-red-400 font-semibold hover:bg-red-500/15 dark:hover:bg-red-500/15 backdrop-blur-xl transition-colors"
                >
                    <LogOut size={20} /> Log Out
                </button>
            </div>
        </main>
    );
}
