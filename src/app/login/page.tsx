"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/jwt/create/`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Login failed");
            }

            const data = await response.json();
            login(data);
            // Return the user to wherever the auth gate sent them from.
            const next = new URLSearchParams(window.location.search).get('next');
            router.push(next || '/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-5 relative overflow-hidden bg-[#f4f6fa] dark:bg-black font-sans">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/20 dark:bg-blue-600/20 blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '5s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/20 dark:bg-purple-600/20 blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '7s' }} />
            
            <div className="w-full max-w-[420px] relative z-10">
                <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/5 relative overflow-hidden transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                    <Link href="/" className="flex items-center justify-center w-full mb-8 no-underline group">
                        <img src="/logo.png" alt="Kauchy" className="h-16 w-auto object-contain dark:hidden transition-transform duration-500 group-hover:scale-105" />
                        <img src="/inverted_logo.png" alt="Kauchy" className="h-16 w-auto object-contain hidden dark:block transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                    
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2 tracking-tight">Welcome Back</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Sign in to continue to Kauchy</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@domain.com"
                                className="w-full px-4 py-3.5 bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-zinc-800"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-3.5 bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-zinc-800"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold p-3 rounded-lg flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="relative w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none rounded-xl text-sm font-bold tracking-wide cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group mt-2" disabled={loading}>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </span>
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-7">
                        <span className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">or</span>
                        <span className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                    </div>

                    <div className="flex justify-center">
                        <GoogleAuthButton next={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null} />
                    </div>

                    <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Don&apos;t have an account? <Link href="/signup" className="text-blue-600 font-bold no-underline transition-colors hover:text-blue-800 ml-1">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
