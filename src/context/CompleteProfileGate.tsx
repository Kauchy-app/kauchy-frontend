"use client";
import React, { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from './AuthContext';
import UniversitySearch from '@/components/UniversitySearch';

/**
 * App-wide blocking modal that appears whenever the signed-in user's profile
 * is incomplete (`profile_completed === false` — i.e. a Google sign-up that
 * still needs phone / university / role). It cannot be dismissed; the user
 * must finish the profile to use the app. Existing users (whose stored auth
 * object predates this flag) have `profile_completed === undefined`, so they
 * are never prompted.
 */
export default function CompleteProfileGate() {
    const { user, login } = useAuth();
    const profile = user?.user;
    const incomplete = !!profile && profile.profile_completed === false;

    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [institute, setInstitute] = useState('');
    const [role, setRole] = useState('buyer');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Prefill the username Google gave us once the gate becomes active.
    useEffect(() => {
        if (incomplete) setUsername(profile?.username || '');
    }, [incomplete, profile?.username]);

    if (!incomplete) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/complete-profile/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.access}`,
                },
                body: JSON.stringify({ username, phone, institute, role }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data.username || data.phone || data.institute || data.role || data.detail || 'Could not save profile';
                throw new Error(Array.isArray(msg) ? msg[0] : msg);
            }
            // Merge the updated profile back into auth state (flips the flag,
            // persists to localStorage, and closes this modal).
            login({ ...user, user: data });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-4 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-xl text-base text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-zinc-400 dark:hover:border-zinc-600";
    const labelClass = "block text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest mb-2.5 ml-1";

    return (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" aria-hidden="true" />

            <div
                role="dialog"
                aria-modal="true"
                aria-label="Complete your profile"
                className="relative w-full sm:w-[480px] max-h-[92vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-10"
            >
                <div className="flex flex-col items-center text-center gap-2 mb-8">
                    {profile?.profile_url
                        ? <img src={profile.profile_url} alt="" className="w-16 h-16 rounded-full object-cover shadow-sm mb-2" />
                        : <GraduationCap size={44} className="text-blue-600 mb-2" />}
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Complete your profile</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[340px]">
                        Welcome{profile?.email ? `, ${profile.email.split('@')[0]}` : ''}! We just need a few more details
                        before you can start using Kauchy.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className={labelClass}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Phone Number</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 border-r border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-l-xl pointer-events-none">
                                <span className="mr-2 text-lg leading-none">🇳🇬</span>
                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">+234</span>
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Mobile number"
                                required
                                className={inputClass + " pl-[110px]"}
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>University <span className="text-zinc-400 dark:text-zinc-500 normal-case tracking-normal ml-1">(Optional)</span></label>
                        <UniversitySearch
                            value={institute}
                            onChange={setInstitute}
                            required
                            variant="default" 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>What brings you here?</label>
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                                className={`${inputClass} appearance-none`}
                            >
                                <option value="buyer" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white py-2">I want to buy things (Buyer)</option>
                                <option value="vendor" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white py-2">I want to sell things (Vendor)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving…' : 'Finish & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
