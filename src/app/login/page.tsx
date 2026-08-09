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
        <div className="min-h-screen w-full flex items-center justify-center p-5 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-zinc-950 dark:to-black font-sans">
            <div className="w-full max-w-[420px]">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 sm:p-10 shadow-sm border border-gray-200 dark:border-zinc-800">
                    <Link href="/" className="flex items-center justify-center w-full mb-6 no-underline">
                        <img src="/logo.png" alt="Kauchy" className="h-20 w-auto object-contain" />
                    </Link>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Enter your credentials to access your account</p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4.5">
                            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@company.com"
                                className="w-full px-3.5 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all duration-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            />
                        </div>

                        <div className="mb-4.5">
                            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full px-3.5 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all duration-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            />
                        </div>

                        {error && <div className="text-xs text-red-500 mb-2.5">{error}</div>}

                        <button type="submit" className="w-full py-3 px-6 bg-blue-600 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-6">
                        <span className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
                        <span className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                    </div>

                    <div className="flex justify-center">
                        <GoogleAuthButton next={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null} />
                    </div>

                    <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                        Don&apos;t have an account? <Link href="/signup" className="text-blue-600 font-semibold no-underline transition-colors hover:text-amber-400">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
