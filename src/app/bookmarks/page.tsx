"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Bookmark, Play, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface BookmarkedPost {
    id: number;
    description: string;
    media_type: string;
    media_url: string | null;
    media_urls: string[];
    kauch: { id: number; name: string; avatar_url: string | null };
    likes_count: number;
    comments_count: number;
    bookmarks_count: number;
    is_bookmarked_by_user: boolean;
    created_at: string;
}

export default function BookmarksPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState<BookmarkedPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/signup'); return; }
        fetchBookmarks();
    }, [user, authLoading]);

    const fetchBookmarks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kauch/bookmarks/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(user as any)?.access}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Error fetching bookmarks', e);
        } finally {
            setLoading(false);
        }
    };

    const getThumbnail = (post: BookmarkedPost): string => {
        if (post.media_urls?.length > 0) return post.media_urls[0];
        if (post.media_url) return post.media_url;
        return '';
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
                <div className="w-10 h-10 border-[3px] border-gray-300 dark:border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bookmark size={24} className="text-amber-400" fill="currentColor" />
                            Saved Posts
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{posts.length} bookmarked post{posts.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Bookmark size={48} className="mb-4 opacity-40" />
                        <p className="text-lg font-medium">No saved posts yet</p>
                        <p className="text-sm mt-1">Long-press a post in the feed to save it</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Browse Feed
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {posts.map(post => {
                            const thumb = getThumbnail(post);
                            return (
                                <div
                                    key={post.id}
                                    onClick={() => router.push(`/kauch/post/${post.id}`)}
                                    className="relative bg-gray-100 dark:bg-zinc-900 rounded-xl overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] aspect-[3/4]"
                                >
                                    {thumb ? (
                                        <Image src={thumb} alt="" fill sizes="(max-width: 768px) 50vw, 240px" className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-zinc-800 text-gray-400">
                                            <Bookmark size={32} />
                                        </div>
                                    )}
                                    {post.media_type === 'video' && (
                                        <div className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5">
                                            <Play size={14} className="text-white" fill="white" />
                                        </div>
                                    )}
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-3">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium truncate w-full">
                                            {post.kauch?.name || 'Kauch'}
                                        </div>
                                    </div>
                                    {/* Stats */}
                                    <div className="absolute bottom-2 left-2 flex items-center gap-3 text-white text-xs drop-shadow">
                                        <span>♥ {post.likes_count}</span>
                                        <span className="text-amber-400">🔖 {post.bookmarks_count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
