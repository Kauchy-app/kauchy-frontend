"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from 'next-themes';
import { ShoppingCart, User, X, Bell, Home, Store, Wallet, MessageSquare, PlusSquare, Search } from 'lucide-react';
import { formatNaira } from '@/utils/formatCurrency';

type Notification = {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    link?: string;
    is_read: boolean;
    created_at: string;
};

export default function Navbar() {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Dynamic data states
    const { walletBalance, cartCount, profileAvatar } = useUserData();
    const { unreadCount } = useNotifications();

    const [searchQuery, setSearchQuery] = useState('');

    // Close dropdowns when clicking outside
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const isVendor = (user?.user?.role || user?.role || '').toLowerCase() === 'vendor'; // Handle potentially different structures case-insensitively

    const showSearchBar = pathname === '/' || pathname === '/vendor-profile' || pathname === '/marketplace';
    const isFullWidthPage = pathname === '/chat' || pathname === '/orders' || pathname === '/cart' || pathname === '/';

    // Immersive pages are always dark (fullscreen TikTok-style feed).
    // Everything else follows the user's chosen theme.
    const isImmersiveDark = pathname === '/' || pathname.startsWith('/feed');
    const isDarkNav = isImmersiveDark || (mounted && resolvedTheme === 'dark');
    // The left sidebar rail is the sole navigation on desktop across all pages, so the
    // top header and bottom bar are both hidden on desktop. On mobile the rail is hidden
    // (it's `hidden md:flex`) and these two bars are the navigation instead.
    const hideHeaderOnDesktop = 'md:hidden';
    const hideBottomNavOnDesktop = 'md:hidden';
    const hideTopHeader = pathname === '/chat' || pathname === '/search'; // Hide the global top header on pages that have their own full-screen/dedicated headers
    const navIconClass = isDarkNav ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100';
    const bnActive = isDarkNav ? 'text-blue-500' : 'text-blue-600';
    const bnInactive = isDarkNav ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900';

    const isMarketplace = pathname === '/marketplace';
    const dynamicLink = isMarketplace ? '/' : '/marketplace';
    const dynamicLabel = isMarketplace ? 'Feed' : 'Marketplace';
    const dynamicIconDesktop = isMarketplace ? '📱' : '🛒';

    return (
        <>
            {/* TOP HEADER — hidden on specific pages */}
            {!hideTopHeader && (
                <header className={`fixed top-0 left-0 right-0 backdrop-blur-md border-b z-[100] py-[12px] px-[20px] shadow-legacy-nav h-[70px] ${hideHeaderOnDesktop} ${isDarkNav ? 'bg-black border-gray-800' : 'bg-[#f4f6fa] border-gray-200'}`}>
                    <div className={`${isFullWidthPage ? '' : 'max-w-[1400px]'} mx-auto flex items-center justify-between gap-5 h-full`}>
                        {/* Left Section: Logo */}
                        <div className="shrink-0 flex items-center">
                            <Link href="/" className="flex items-center gap-2 no-underline font-bold text-blue-600 text-lg w-[144px] h-[48px] overflow-hidden" title="Home">
                                <img
                                    src="/darkmodelogo.png"
                                    alt="Upstart"
                                    className="h-[140px] w-auto object-cover object-[30%_40%] max-w-none"
                                />
                            </Link>
                        </div>

                        {/* Center Section: Search Bar (Desktop) */}
                        {showSearchBar && (
                            <div className="hidden md:flex flex-1 max-w-[500px] items-center justify-center">
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        className={`w-full h-[44px] pl-4 pr-10 rounded-full border text-sm transition-all focus:outline-none focus:border-blue-600 ${isDarkNav ? 'border-gray-700 bg-white/10 text-white placeholder:text-gray-400 focus:bg-white/15' : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white'}`}
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && searchQuery.trim()) {
                                                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                                            }
                                        }}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                </div>
                            </div>
                        )}

                        {/* Right Section: Icons */}
                        <div className="flex items-center gap-3">
                            {/* Search — opens the dedicated search page (marketplace only) */}
                            {pathname === '/marketplace' && (
                                <Link href="/search" className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${navIconClass}`} title="Search">
                                    <Search size={22} />
                                </Link>
                            )}

                            {user ? (
                                <>
                                    {/* Analytics - Vendor Only */}
                                    {isVendor && (
                                        <div className="hidden md:block">
                                            <Link href="/analytics" className={`flex items-center gap-2 px-3 py-2 font-medium hover:text-blue-600 transition-colors ${isDarkNav ? 'text-gray-200' : 'text-gray-700'}`} title="Analytics">
                                                <span>📊 Analytics</span>
                                            </Link>
                                        </div>
                                    )}

                                    {/* Wallet */}
                                    <div className="block">
                                        <Link href="/wallet" className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-amber-400 text-white rounded-lg hover:bg-amber-500 transition-colors decoration-0 shadow-sm" title="Wallet">
                                            <Wallet size={18} className="shrink-0" />
                                        </Link>
                                    </div>

                                    {/* Cart */}
                                    <div className="relative">
                                        <Link href="/cart" className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors relative ${navIconClass}`} title="Cart">
                                            <ShoppingCart size={22} />
                                            {cartCount > 0 && <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 ${isDarkNav ? 'border-black' : 'border-white dark:border-black'}`}>{cartCount}</span>}
                                        </Link>
                                    </div>

                                    {/* Notifications Link */}
                                    <div className="relative">
                                        <Link href="/notifications" className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors relative ${navIconClass}`} title="Notifications">
                                            <Bell size={22} />
                                            {unreadCount > 0 && <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 ${isDarkNav ? 'border-black' : 'border-white dark:border-black'}`}>{unreadCount}</span>}
                                        </Link>
                                    </div>

                                    {/* Profile Dropdown */}
                                    <div className="relative hidden md:block" ref={profileRef}>
                                        <button className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isDarkNav ? 'bg-white/10 text-gray-100 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setIsProfileOpen(!isProfileOpen)} title="Profile">
                                            <User size={20} />
                                        </button>
                                        {isProfileOpen && (
                                            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50 animate-fadeIn py-1">
                                                {pathname !== '/profile' && (
                                                    <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-blue-600">View Profile</Link>
                                                )}
                                                {isVendor && pathname !== '/inventory' && (
                                                    <Link href="/inventory" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-blue-600">My Inventory</Link>
                                                )}
                                                {pathname !== '/orders' && (
                                                    <Link href="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-blue-600">Orders</Link>
                                                )}
                                                {pathname !== '/chat' && (
                                                    <Link href="/chat" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-blue-600">Messages</Link>
                                                )}
                                                <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1"></div>
                                                <button onClick={() => { setIsProfileOpen(false); logout(); }} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">Logout</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2">
                                    <Link href="/signup" className={`text-sm font-semibold hover:text-blue-600 px-2 sm:px-3 py-2 whitespace-nowrap ${isDarkNav ? 'text-gray-200' : 'text-gray-700'}`}>Login</Link>
                                    <Link href="/signup" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 sm:px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all whitespace-nowrap">Sign Up</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            )}

            {/* BOTTOM NAVIGATION BAR */}
            <nav className={`fixed bottom-0 left-0 right-0 border-t z-[100] pb-safe ${hideBottomNavOnDesktop} ${isDarkNav ? 'bg-black border-gray-800 shadow-[0_-4px_10px_rgba(0,0,0,0.4)]' : 'bg-white border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'}`}>
                <div className="max-w-[800px] mx-auto flex items-center justify-around h-[65px] px-2">
                    <Link href="/" className={`flex flex-col items-center justify-center w-[60px] h-full transition-colors ${pathname === '/' ? bnActive : bnInactive}`}>
                        <Home size={22} className="mb-0.5" />
                        <span className="text-[10px] font-semibold">Feed</span>
                    </Link>

                    <Link href="/marketplace" className={`flex flex-col items-center justify-center w-[60px] h-full transition-colors ${pathname === '/marketplace' ? bnActive : bnInactive}`}>
                        <Store size={22} className="mb-0.5" />
                        <span className="text-[10px] font-semibold">Market</span>
                    </Link>

                    {isVendor && (
                        <Link href="/kauch/create" className={`flex flex-col items-center justify-center w-[60px] h-full transition-colors ${pathname === '/kauch/create' ? bnActive : bnInactive}`}>
                            <PlusSquare size={22} className="mb-0.5" />
                            <span className="text-[10px] font-semibold">Create</span>
                        </Link>
                    )}

                    <Link href="/chat" className={`flex flex-col items-center justify-center w-[60px] h-full transition-colors ${pathname === '/chat' ? bnActive : bnInactive}`}>
                        <MessageSquare size={22} className="mb-0.5" />
                        <span className="text-[10px] font-semibold">Messages</span>
                    </Link>

                    <Link
                        href={user ? '/account' : '/signup'}
                        className={`flex flex-col items-center justify-center w-[60px] h-full transition-colors ${pathname === '/account' ? bnActive : bnInactive}`}
                    >
                        {profileAvatar ? (
                            <span className={`w-6 h-6 rounded-full overflow-hidden mb-0.5 bg-gray-200 dark:bg-zinc-700 ${pathname === '/account' ? 'ring-2 ring-blue-500' : ''}`}>
                                <Image src={profileAvatar} alt="Profile" width={24} height={24} className="w-full h-full object-cover" />
                            </span>
                        ) : (
                            <User size={22} className="mb-0.5" />
                        )}
                        <span className="text-[10px] font-semibold">Profile</span>
                    </Link>
                </div>
            </nav>
        </>
    );
}
