"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAuthGate } from '@/context/AuthGateContext';
import { Heart, MessageCircle, Share2, MoreHorizontal, ShoppingBag, ArrowLeft, Users, Send, Mic, X, Trash2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import Image from 'next/image';
import { formatNaira } from '@/utils/formatCurrency';

interface Comment {
  id: number;
  user: { id: number; username: string; avatar_url: string };
  text: string;
  parent?: number | null;
  created_at: string;
}

interface TaggedProduct {
  id: number;
  product_name: string;
  price: string;
  image_url: string[];
}

interface Post {
  id: number;
  description: string;
  media_type: 'image' | 'video' | 'audio';
  media_url: string;
  media_urls?: string[];
  tagged_products: TaggedProduct[];
  likes_count: number;
  comments_count: number;
  is_liked_by_user: boolean;
  created_at: string;
}

interface Kauch {
  id: number;
  name: string;
  description: string;
  avatar_url: string | null;
  followers_count: number;
  is_following: boolean;
  owner_id: string;
  owner_username: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function KauchProfile() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { requireAuth } = useAuthGate();
  const kauchId = params?.id as string;

  const [kauch, setKauch] = useState<Kauch | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Kauch State
  const [isEditKauchOpen, setIsEditKauchOpen] = useState(false);
  const [editKauchForm, setEditKauchForm] = useState({ name: '', description: '' });
  const [editKauchAvatar, setEditKauchAvatar] = useState<File | null>(null);
  const [isSavingKauch, setIsSavingKauch] = useState(false);

  // Delete Post State
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Comments: which post is expanded, and per-post data
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<number, Comment[]>>({});
  const [commentLoading, setCommentLoading] = useState<number | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<number | null>(null);
  // Reply target per post: { [postId]: { id, username } } (id = top-level comment).
  const [replyTo, setReplyTo] = useState<Record<number, { id: number; username: string } | null>>({});
  // Top-level comment ids whose reply threads are expanded.
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());
  const toggleThread = (id: number) =>
    setExpandedThreads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    if (!kauchId) return;

    const headers: Record<string, string> = {};
    if (user) headers['Authorization'] = `Bearer ${user.access}`;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [kRes, pRes] = await Promise.all([
          fetch(`${API}/kauch/${kauchId}/`, { headers }),
          fetch(`${API}/kauch/${kauchId}/posts/`, { headers }),
        ]);
        if (kRes.ok) setKauch(await kRes.json());
        if (pRes.ok) {
          const data = await pRes.json();
          // Voice-note posts look out of place in the visual feed — keep the feed
          // to images/videos only and drop audio posts.
          setPosts(Array.isArray(data) ? data.filter((p: Post) => p.media_type !== 'audio') : []);
        }
      } catch (e) {
        console.error('Failed to load kauch', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [kauchId, user]);

  const handleFollowToggle = async () => {
    if (!requireAuth('follow this store')) return;
    if (!kauch) return;

    // optimistic update
    setKauch(prev => prev && ({
      ...prev,
      is_following: !prev.is_following,
      followers_count: prev.is_following ? prev.followers_count - 1 : prev.followers_count + 1,
    }));

    try {
      const res = await fetch(`${API}/kauch/${kauch.id}/follow/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKauch(prev => prev && ({
          ...prev,
          is_following: data.is_following,
          followers_count: data.followers_count,
        }));
      } else {
        throw new Error('failed');
      }
    } catch (e) {
      // revert on failure
      setKauch(prev => prev && ({
        ...prev,
        is_following: !prev.is_following,
        followers_count: prev.is_following ? prev.followers_count - 1 : prev.followers_count + 1,
      }));
      showToast('Could not update follow status.', 'error');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${kauch?.name} on Kauchy`,
      text: kauch?.description || `Check out ${kauch?.name} on Kauchy!`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      showToast('Profile link copied to clipboard!', 'success');
    }
  };

  const handleLike = async (id: number) => {
    if (!requireAuth('like posts')) return;

    // optimistic update
    setPosts(prev => prev.map(post =>
      post.id === id
        ? {
            ...post,
            is_liked_by_user: !post.is_liked_by_user,
            likes_count: post.is_liked_by_user ? post.likes_count - 1 : post.likes_count + 1,
          }
        : post
    ));

    try {
      const res = await fetch(`${API}/kauch/posts/${id}/like/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(post =>
          post.id === id
            ? { ...post, is_liked_by_user: data.liked, likes_count: data.likes_count }
            : post
        ));
      } else {
        throw new Error('failed');
      }
    } catch (e) {
      // revert on failure
      setPosts(prev => prev.map(post =>
        post.id === id
          ? {
              ...post,
              is_liked_by_user: !post.is_liked_by_user,
              likes_count: post.is_liked_by_user ? post.likes_count - 1 : post.likes_count + 1,
            }
          : post
      ));
      showToast('Could not update like.', 'error');
    }
  };

  const fetchComments = async (postId: number) => {
    setCommentLoading(postId);
    try {
      const res = await fetch(`${API}/kauch/posts/${postId}/comments/`);
      if (res.ok) {
        const data = await res.json();
        setCommentsMap(prev => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
      }
    } catch (e) {
      console.error('Failed to load comments', e);
    } finally {
      setCommentLoading(null);
    }
  };

  const toggleComments = (postId: number) => {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }
    setOpenComments(postId);
    if (commentsMap[postId] === undefined) fetchComments(postId);
  };

  const submitComment = async (postId: number) => {
    if (!requireAuth('comment')) return;
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    setCommentSubmitting(postId);
    const parent = replyTo[postId]?.id ?? null;
    try {
      const res = await fetch(`${API}/kauch/posts/${postId}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({ text, parent }),
      });
      if (res.ok) {
        const created: Comment = await res.json();
        setCommentsMap(prev => ({ ...prev, [postId]: [created, ...(prev[postId] || [])] }));
        setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
        if (created.parent) setExpandedThreads(prev => new Set(prev).add(created.parent as number));
        setReplyTo(prev => ({ ...prev, [postId]: null }));
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        ));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to post comment.', 'error');
      }
    } catch (e) {
      showToast('Error posting comment.', 'error');
    } finally {
      setCommentSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f4f6fa] dark:bg-zinc-950 min-h-[calc(100vh-70px)] flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!kauch) {
    return (
      <div className="bg-[#f4f6fa] dark:bg-zinc-950 min-h-[calc(100vh-70px)] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-600 dark:text-zinc-400">Kauch not found.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Go back</button>
      </div>
    );
  }
  
  const handleEditKauch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKauchForm.name.trim()) return showToast("Name is required", "error");
    setIsSavingKauch(true);
    try {
        const formData = new FormData();
        formData.append("name", editKauchForm.name);
        formData.append("description", editKauchForm.description);
        if (editKauchAvatar) formData.append("avatar", editKauchAvatar);

        const res = await fetch(`${API}/kauch/${kauchId}/`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${user.access}` },
            body: formData
        });

        if (res.ok) {
            const updated = await res.json();
            setKauch(prev => prev ? { ...prev, ...updated } : null);
            setIsEditKauchOpen(false);
            showToast("Kauch updated successfully!", "success");
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || "Failed to update Kauch", "error");
        }
    } catch (e) {
        showToast("Error updating Kauch", "error");
    } finally {
        setIsSavingKauch(false);
    }
  };

  const isOwner = user?.user?.id && kauch.owner_id && String(user.user.id) === String(kauch.owner_id);

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
        const res = await fetch(`${API}/kauch/posts/${postToDelete}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${user.access}` }
        });
        if (res.ok) {
            setPosts(prev => prev.filter(p => p.id !== postToDelete));
            showToast("Post deleted successfully!", "success");
        } else {
            showToast("Failed to delete post", "error");
        }
    } catch (e) {
        showToast("Error deleting post", "error");
    } finally {
        setIsDeletingPost(false);
        setPostToDelete(null);
    }
  };

  // Shared profile card — stacks on top on mobile, lives in the sidebar on desktop.
  const profileCard = (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10">
      <div className="flex flex-col items-center text-center gap-5">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-4 ring-zinc-100 dark:ring-zinc-800 shrink-0">
          <Image src={kauch.avatar_url || '/placeholder.svg'} alt={kauch.name} fill sizes="(max-width: 640px) 112px, 128px" className="object-cover" />
        </div>
        <div className="w-full">
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-2">{kauch.name}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 leading-relaxed max-w-md mx-auto">
            {kauch.description?.trim() || 'Discover our latest drops and shop the products tagged in every post.'}
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Owned by</span>
            <button 
              onClick={() => router.push(`/vendor-profile?vendorId=${kauch.owner_id}`)}
              className="text-sm font-semibold text-blue-600 hover:underline transition-all"
            >
              @{kauch.owner_username}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-white">
              <Users size={18} className="text-blue-600" />
              <span>{kauch.followers_count.toLocaleString()} <span className="text-zinc-500 dark:text-zinc-400 font-normal">Followers</span></span>
            </div>

            <button
              onClick={handleFollowToggle}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                kauch.is_following
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  : 'bg-amber-400 text-white hover:bg-amber-500 shadow-md'
              }`}
            >
              {kauch.is_following ? 'Following' : 'Follow'}
            </button>
            
            {isOwner && (
              <button
                onClick={() => {
                  setEditKauchForm({ name: kauch.name, description: kauch.description || '' });
                  setEditKauchAvatar(null);
                  setIsEditKauchOpen(true);
                }}
                className="px-6 py-2 rounded-full font-bold text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Edit Kauch
              </button>
            )}
            
            <button
              onClick={handleShare}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Share Kauch Profile"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Kauch Modal */}
      {isEditKauchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !isSavingKauch && setIsEditKauchOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Edit Kauch Profile</h2>
            <form onSubmit={handleEditKauch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Kauch Name</label>
                <input
                  type="text"
                  value={editKauchForm.name}
                  onChange={e => setEditKauchForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Description</label>
                <textarea
                  value={editKauchForm.description}
                  onChange={e => setEditKauchForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">New Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setEditKauchAvatar(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditKauchOpen(false)}
                  disabled={isSavingKauch}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingKauch}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSavingKauch ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  return (
    <div className="bg-[#f4f6fa] dark:bg-zinc-950 min-h-[calc(100vh-70px)] pb-20">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-[#f4f6fa]/85 dark:bg-zinc-950/85 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft size={22} className="text-zinc-900 dark:text-white" />
          </button>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{kauch.name}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:items-start">

          {/* Main column — posts feed */}
          <div className="min-w-0">
            {/* Profile card stacks here on mobile; moves to the sidebar on desktop */}
            <div className="lg:hidden mb-6">{profileCard}</div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4 px-1 border-b border-zinc-200 dark:border-zinc-800 pb-2">Posts</h3>

        {posts.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm px-2">No posts yet.</p>
        ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{timeAgo(post.created_at)}</span>
                  {isOwner ? (
                      <button 
                          onClick={() => setPostToDelete(post.id)} 
                          className="text-red-500 hover:text-red-600 p-1 transition-all" 
                          title="Delete post"
                      >
                        <Trash2 size={18} />
                      </button>
                  ) : (
                      <button className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 transition-all">
                        <MoreHorizontal size={20} />
                      </button>
                  )}
                </div>
                <p className="text-zinc-800 dark:text-zinc-100 text-sm leading-relaxed mb-4 whitespace-pre-line">{post.description}</p>
              </div>

              {/* Media Container — one video, one image, or a swipeable image carousel */}
              {(() => {
                const images = (post.media_urls && post.media_urls.length > 0)
                  ? post.media_urls
                  : (post.media_url ? [post.media_url] : []);
                if (images.length === 0) return null;

                // Video keeps a fixed frame; a single image shows at its natural
                // aspect (no crop, no letterbox); a carousel uses object-contain in
                // a frame so every slide is the same height and nothing is cropped.
                if (post.media_type === 'audio') {
                  return (
                    <div className="w-full p-5 bg-zinc-50 dark:bg-zinc-800/60 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Mic size={22} className="text-white" />
                      </div>
                      <audio src={images[0]} controls className="flex-1 min-w-0" />
                    </div>
                  );
                }
                if (post.media_type === 'video') {
                  return (
                    <div className="w-full aspect-square sm:aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                      <video src={images[0]} className="w-full h-full object-cover" controls />
                    </div>
                  );
                }
                if (images.length === 1) {
                  return (
                    <div className="w-full bg-black flex justify-center">
                      <Image src={images[0]} alt="Post media" width={1080} height={1080} className="w-full h-auto max-h-[85vh] object-contain" />
                    </div>
                  );
                }
                return (
                  <div className="w-full aspect-square sm:aspect-[4/5] bg-black relative overflow-hidden">
                    <Swiper
                      modules={[Pagination]}
                      slidesPerView={1}
                      pagination={{ clickable: true }}
                      className="w-full h-full kauch-post-carousel"
                    >
                      {images.map((src, i) => (
                        <SwiperSlide key={`${src}-${i}`} className="relative">
                          <Image src={src} alt={`Post media ${i + 1}`} fill sizes="100vw" className="object-contain" />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                );
              })()}

              {/* Actions Bar */}
              <div className="px-4 py-4 flex items-center gap-6 border-b border-zinc-50 dark:border-zinc-800">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 group">
                  <Heart size={26} className={`transition-all ${post.is_liked_by_user ? 'fill-red-500 text-red-500' : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900'}`} />
                  <span className={`font-medium ${post.is_liked_by_user ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-400'}`}>{post.likes_count}</span>
                </button>
                <button onClick={() => toggleComments(post.id)} className={`flex items-center gap-2 group transition-colors ${openComments === post.id ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}>
                  <MessageCircle size={26} className="transition-transform group-hover:scale-110" />
                  <span className="font-medium">{post.comments_count}</span>
                </button>
                <button
                    onClick={() => {
                        const url = `${window.location.origin}/kauch/post/${post.id}`;
                        if (navigator.share) {
                            navigator.share({
                                title: 'Kauchy Post',
                                text: post.description || 'Check out this post on Kauchy',
                                url: url
                            }).catch(console.error);
                        } else {
                            navigator.clipboard.writeText(url);
                            showToast('Post link copied to clipboard!', 'success');
                        }
                    }} 
                    className="flex items-center gap-2 group text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <Share2 size={24} className="transition-transform group-hover:scale-110" />
                </button>
              </div>

              {/* Comments Panel */}
              {openComments === post.id && (
                <div className="px-4 py-4 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                  {/* Composer */}
                  {replyTo[post.id] && (
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs mb-2">
                      <span>Replying to <b>@{replyTo[post.id]!.username}</b></span>
                      <button onClick={() => setReplyTo(prev => ({ ...prev, [post.id]: null }))} className="hover:text-blue-900 dark:hover:text-blue-100">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitComment(post.id); }}
                      placeholder={!user ? 'Log in to comment' : replyTo[post.id] ? `Reply to @${replyTo[post.id]!.username}...` : 'Add a comment...'}
                      disabled={!user}
                      className="flex-1 border border-zinc-300 dark:border-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 bg-white dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                    />
                    <button
                      onClick={() => submitComment(post.id)}
                      disabled={!user || commentSubmitting === post.id || !(commentDrafts[post.id] || '').trim()}
                      className="p-2.5 bg-blue-600 text-white rounded-full disabled:opacity-50 flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      {commentSubmitting === post.id
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send size={18} />}
                    </button>
                  </div>

                  {/* List (threaded: top-level comments with their replies) */}
                  {commentLoading === post.id ? (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-2">Loading comments...</p>
                  ) : (commentsMap[post.id]?.length ?? 0) === 0 ? (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-2 italic">No comments yet. Be the first!</p>
                  ) : (
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                      {commentsMap[post.id].filter(c => !c.parent).map(comment => {
                        const replies = commentsMap[post.id].filter(c => c.parent === comment.id);
                        const expanded = expandedThreads.has(comment.id);
                        const startReply = (c: Comment, isReply: boolean) => {
                          const topId = isReply ? (c.parent as number) : c.id;
                          setReplyTo(prev => ({ ...prev, [post.id]: { id: topId, username: c.user?.username || 'User' } }));
                          if (isReply) setCommentDrafts(prev => ({ ...prev, [post.id]: `@${c.user?.username || 'User'} ` }));
                          setExpandedThreads(prev => new Set(prev).add(topId));
                        };
                        const renderRow = (c: Comment, isReply: boolean) => (
                          <div key={c.id} className="flex gap-3">
                            <div className={`relative ${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0`}>
                              <Image src={c.user?.avatar_url || '/placeholder.svg'} alt="" fill sizes="48px" className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="bg-white dark:bg-zinc-900 rounded-2xl px-3 py-2 border border-zinc-100 dark:border-zinc-800">
                                <p className="text-xs font-bold text-zinc-900 dark:text-white">{c.user?.username || 'User'}</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">{c.text}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-1 ml-1">
                                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{timeAgo(c.created_at)}</span>
                                {user && (
                                  <button
                                    onClick={() => startReply(c, isReply)}
                                    className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-blue-600"
                                  >
                                    Reply
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                        return (
                          <div key={comment.id} className="space-y-2">
                            {renderRow(comment, false)}
                            {replies.length > 0 && (
                              <div className="ml-11">
                                {!expanded ? (
                                  <button onClick={() => toggleThread(comment.id)} className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                                    <span className="w-6 h-px bg-zinc-300 dark:bg-zinc-600" />
                                    View {replies.length} {replies.length > 1 ? 'replies' : 'reply'}
                                  </button>
                                ) : (
                                  <div className="flex flex-col gap-2 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
                                    {replies.map(rep => renderRow(rep, true))}
                                    <button onClick={() => toggleThread(comment.id)} className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                                      <span className="w-6 h-px bg-zinc-300 dark:bg-zinc-600" />
                                      Hide replies
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tagged Products Carousel */}
              {post.tagged_products.length > 0 && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
                    <ShoppingBag size={16} className="text-blue-600" />
                    Tagged Products
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {post.tagged_products.map(product => (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/feed?type=product&id=${product.id}`)}
                        className="min-w-[140px] max-w-[140px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden cursor-pointer snap-start hover:border-blue-500 transition-all shadow-sm group"
                      >
                        <div className="h-[120px] bg-zinc-100 dark:bg-zinc-800 relative">
                          <Image src={product.image_url?.[0] || '/placeholder.svg'} alt={product.product_name} fill sizes="240px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-medium text-zinc-900 dark:text-white truncate" title={product.product_name}>{product.product_name}</p>
                          <p className="text-sm font-bold text-blue-600 mt-0.5">{formatNaira(product.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
        )}
          </div>{/* /main column */}

          {/* Sidebar — desktop only, sticky beneath the top bar */}
          <aside className="hidden lg:block lg:sticky lg:top-[76px]">
            {profileCard}
          </aside>

        </div>{/* /grid */}
      </div>{/* /container */}
      {/* Delete Post Confirmation Modal */}
      {postToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !isDeletingPost && setPostToDelete(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fadeIn text-center" onClick={e => e.stopPropagation()}>
            <Trash2 size={48} className="text-red-500 mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Delete Post?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
              This action cannot be undone. Are you sure you want to permanently delete this post?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPostToDelete(null)}
                disabled={isDeletingPost}
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePost}
                disabled={isDeletingPost}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-md transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isDeletingPost ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
