"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { AuthWall } from '@/context/AuthGateContext';
import { useToast } from '@/context/ToastContext';
import { useUserData } from '@/context/UserDataContext';
import LoadingModal from '@/components/LoadingModal';
import { UserProfile } from '@/types';
import UniversitySearch from '@/components/UniversitySearch';
import { useTheme } from 'next-themes';
import { Moon, Sun, Camera, Pencil, Mail, Phone, GraduationCap, User as UserIcon } from 'lucide-react';


export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const { profile: contextProfile, refreshUserData } = useUserData();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{ bio: string; institute: string }>({ bio: '', institute: '' });


    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const currentTheme = theme === 'system' ? systemTheme : theme;

    useEffect(() => {
        if (contextProfile) {
            setProfile(contextProfile as UserProfile);
            setLoading(false);
        } else if (user && !contextProfile) {
            setProfile(user.user as unknown as UserProfile);
            setLoading(false);
        } else if (!user) {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [user, contextProfile]);



    const startEdit = () => {
        if (!profile) return;
        setEditForm({
            bio: profile.bio || '',
            institute: profile.institute || ''
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/me/`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                const updated: Partial<UserProfile> = await res.json();
                setProfile(prev => prev ? { ...prev, ...updated } : null);
                setIsEditing(false);
                refreshUserData();
                showToast("Profile updated successfully!", "success");
            } else {
                const error = await res.json();
                showToast(error.detail || "Update failed", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error updating profile", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file.', 'error');
            e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be less than 5MB.', 'error');
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('profile_picture', file);

        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/me/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${user.access}` },
                body: formData
            });
            if (res.ok) {
                const updated: Partial<UserProfile> = await res.json();
                setProfile(prev => prev && updated.profile_url ? { ...prev, profile_url: updated.profile_url } : prev);
                refreshUserData();
                showToast("Profile picture updated successfully!", "success");
            } else {
                const error = await res.json();
                showToast(error.detail || "Photo upload failed", "error");
            }
        } catch (e) {
            showToast("Photo upload failed", "error");
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    if (!user) return <AuthWall reason="view your profile" loading={authLoading} />;
    if (loading && !profile) return <LoadingModal />;

    const inputBase = "w-full px-3.5 py-3 rounded-xl text-sm text-gray-900 dark:text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500/60 border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-sm dark:placeholder-gray-500";
    const inputDisabled = "w-full px-3.5 py-3 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.03] dark:bg-white/[0.02] cursor-not-allowed";

    return (
        <main className="relative min-h-[calc(100dvh-135px)] md:min-h-screen chat-bg overflow-hidden">
            <div className="relative max-w-[640px] mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5">
                {loading && <LoadingModal />}

                {/* Profile Header Card */}
                <div className="relative rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-sm">
                    <div className="h-28 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 relative">
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(600px_200px_at_20%_0%,rgba(255,255,255,0.4),transparent_60%)]" />
                    </div>
                    <div className="px-6 pb-6 -mt-14 flex flex-col items-center text-center">
                        <div className="relative">
                            <div
                                className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white dark:ring-zinc-900 bg-gray-100 dark:bg-zinc-800 shadow-lg cursor-pointer transition-transform duration-300 hover:scale-105"
                                onClick={() => document.getElementById('photoInput')?.click()}
                            >
                                <Image
                                    src={profile?.profile_url || profile?.pfp || "/placeholder.svg"}
                                    alt="Profile"
                                    width={112}
                                    height={112}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => document.getElementById('photoInput')?.click()}
                                aria-label="Change photo"
                                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-900 transition-colors"
                            >
                                <Camera size={16} />
                            </button>
                            <input type="file" id="photoInput" hidden onChange={handlePhotoChange} accept="image/*" />
                        </div>

                        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{profile?.username}</h1>
                        {profile?.role && (
                            <span className="inline-block mt-1.5 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-400/20 px-3 py-0.5 rounded-full text-xs font-semibold capitalize">
                                {profile.role}
                            </span>
                        )}
                    </div>
                </div>

                {/* Account Information Card */}
                <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h2>
                        {!isEditing && (
                            <button
                                onClick={startEdit}
                                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 dark:border-indigo-400/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/15 transition-colors"
                            >
                                <Pencil size={13} /> Edit
                            </button>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <UserIcon size={14} className="text-gray-400" /> Username
                        </label>
                        <input type="text" className={inputDisabled} value={profile?.username || ''} disabled />
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <Mail size={14} className="text-gray-400" /> Email
                        </label>
                        <input type="email" className={inputDisabled} value={profile?.email || ''} disabled />
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <Phone size={14} className="text-gray-400" /> Phone Number
                        </label>
                        <input type="text" className={inputDisabled} value={profile?.phone || ''} disabled />
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <Pencil size={14} className="text-gray-400" /> Bio
                        </label>
                        {isEditing ? (
                            <textarea
                                className={`${inputBase} min-h-[88px] max-h-[300px] leading-relaxed`}
                                placeholder="Tell others a bit about yourself…"
                                value={editForm.bio}
                                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                            />
                        ) : (
                            <p className="w-full px-3.5 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-300 border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.03] dark:bg-white/[0.02] min-h-[88px] leading-relaxed whitespace-pre-wrap">
                                {profile?.bio || <span className="text-gray-400 dark:text-gray-500">No bio added yet.</span>}
                            </p>
                        )}
                    </div>

                    <div className="mb-1">
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <GraduationCap size={14} className="text-gray-400" /> University
                        </label>
                        {isEditing ? (
                            <UniversitySearch
                                value={editForm.institute}
                                onChange={(val) => setEditForm({ ...editForm, institute: val })}
                            />
                        ) : (
                            <input type="text" className={inputDisabled} value={profile?.institute || ''} placeholder="Not set" disabled />
                        )}
                    </div>

                    {isEditing && (
                        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-5">
                            <button
                                className="flex-1 py-3 px-6 rounded-xl text-sm font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-gray-700 dark:text-gray-200 hover:bg-black/[0.07] dark:hover:bg-white/[0.1] transition-colors"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 py-3 px-6 rounded-xl text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                                onClick={handleSave}
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>

                {/* Preferences Card */}
                <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center shrink-0">
                                {mounted && currentTheme === 'dark'
                                    ? <Sun size={18} className="text-amber-500" />
                                    : <Moon size={18} className="text-indigo-600 dark:text-indigo-300" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">Dark Mode</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark mode appearance</p>
                            </div>
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
            </div>
        </main>
    );
}
