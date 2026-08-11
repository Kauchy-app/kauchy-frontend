"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAuthGate } from '@/context/AuthGateContext';
import Image from 'next/image';
import { formatNaira } from '@/utils/formatCurrency';
import { Grid, List, QrCode } from 'lucide-react';

function VendorProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const vendorId = searchParams.get('vendorId');
    const itemId = searchParams.get('itemId');
    const { user } = useAuth();
    const { requireAuth } = useAuthGate();

    const [vendor, setVendor] = useState<any | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [kauches, setKauches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Digital Menu States
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    // Derived values for the menu: prioritize custom Menu/Collection in specs, then fallback to category
    const getProductMenu = (p: any) => {
        if (p.specs) {
            const keys = Object.keys(p.specs);
            const menuKey = keys.find(k => k.toLowerCase() === 'menu' || k.toLowerCase() === 'collection' || k.toLowerCase() === 'subcategory');
            if (menuKey) return p.specs[menuKey];
        }
        return p.category;
    };

    const categories = ['All', ...Array.from(new Set(products.map(getProductMenu).filter(Boolean)))];
    const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => getProductMenu(p) === selectedCategory);


    useEffect(() => {
        if (vendorId) {
            loadVendorData();
        } else {
            setLoading(false);
        }
    }, [vendorId]);

    const loadVendorData = async () => {
        try {
            // Fetch Vendor Info
            const resVendor = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user/${vendorId}`);
            if (resVendor.ok) {
                const data = await resVendor.json();
                setVendor(data);
            }

            const headers: Record<string, string> = {
                "Content-Type": "application/json"
            };
            if (user && user.access) {
                headers["Authorization"] = `Bearer ${user.access}`;
            }

            // Fetch Vendor Products
            const resProducts = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/vendor-products/${vendorId}`, { headers });
            if (resProducts.ok) {
                const data = await resProducts.json();
                const productList = Array.isArray(data) ? data : [];
                setProducts(productList);

                if (itemId) {
                    const foundProduct = productList.find(p => p._id === itemId || p.id?.toString() === itemId);
                    if (foundProduct) {
                        router.push(`/feed?type=product&id=${itemId}&vendorId=${vendorId}`);
                        // Clean up URL to avoid re-triggering on subsequent renders
                        window.history.replaceState({}, document.title, window.location.pathname + "?vendorId=" + vendorId);
                    }
                }
            }
            
            // Fetch Vendor Kauches
            const resKauches = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kauch/vendor/${vendorId}/`, { headers });
            if (resKauches.ok) {
                const data = await resKauches.json();
                setKauches(Array.isArray(data) ? data : []);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleContact = async () => {
        if (!requireAuth('contact the vendor')) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/create/${vendorId}`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${user.access}`,
                    "Content-Type": "application/json"
                }
            });
            if (res.ok) {
                window.location.href = '/chat';
            } else {
                alert("Failed to create conversation");
            }
        } catch (e) {
            alert("Error contacting vendor");
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: vendor?.info?.username || 'Vendor Profile',
                text: `Check out ${vendor?.info?.username}'s store on Kauchy!`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    if (loading) return <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">Loading...</div>;
    if (!vendor) return <div className="p-12 text-center text-red-500">Vendor not found</div>;

    return (
        <>
        <div className="min-h-screen font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
            <main className="w-full max-w-[1400px] mx-auto py-5 px-2.5 sm:py-10 sm:px-5">
                <div className="flex flex-col gap-6 sm:gap-10">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 sm:p-8 shadow-legacy-card">
                        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800 text-center md:text-left">
                            <Image
                                src={vendor.info?.profile_url || '/placeholder.svg?height=120&width=120'}
                                alt="Vendor"
                                width={120}
                                height={120}
                                className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full object-cover mx-auto md:mx-0 bg-zinc-100 dark:bg-zinc-800"
                            />
                            <div className="flex flex-col gap-1">
                                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{vendor.info?.username}</h1>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">{vendor.info?.institute || "Institute N/A"}</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">{vendor.info?.department || "Department N/A"}</p>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                    <span className="text-amber-400 text-base">
                                        {"★".repeat(Math.round(vendor.info?.rating || 5)) + "☆".repeat(5 - Math.round(vendor.info?.rating || 5))}
                                    </span>
                                    <span className="text-[13px] text-zinc-600 dark:text-zinc-400">({vendor.info?.reviews?.length || 0} reviews)</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
                                <button
                                    className="px-6 py-3 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md flex-1 md:flex-none"
                                    onClick={handleContact}
                                >
                                    Contact Vendor
                                </button>
                                <button
                                    className="flex items-center justify-center p-3 sm:px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 cursor-pointer transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-blue-600 hover:border-blue-600 shrink-0 gap-2"
                                    onClick={handleShare}
                                    title="Share Menu"
                                >
                                    <QrCode size={18} />
                                    <span className="hidden sm:inline text-sm font-semibold">Share Menu</span>
                                </button>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">About This Seller</h3>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                <p>{vendor.info?.bio || "No bio available."}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg text-center">
                                    <span className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Total Sales</span>
                                    <span className="block text-xl font-bold text-blue-600">{vendor.sales || 0}</span>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg text-center">
                                    <span className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Rating</span>
                                    <span className="block text-xl font-bold text-blue-600">{vendor.info?.rating || "0.0"}</span>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg text-center">
                                    <span className="block text-xs text-zinc-600 dark:text-zinc-400 mb-2">Products</span>
                                    <span className="block text-xl font-bold text-blue-600">{products.length}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Vendor Kauches */}
                        {kauches.length > 0 && (
                            <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Communities</h3>
                                <div className="flex flex-wrap gap-4">
                                    {kauches.map(kauch => (
                                        <div 
                                            key={kauch.id} 
                                            className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:shadow-sm"
                                            onClick={() => router.push(`/kauch/${kauch.id}`)}
                                        >
                                            <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden shrink-0">
                                                <Image src={kauch.avatar_url || '/placeholder.svg'} width={48} height={48} className="object-cover w-full h-full" alt={kauch.name} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-zinc-900 dark:text-white">{kauch.name}</div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">{kauch.followers_count} followers</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Menu Controls */}
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Store Items</h2>
                            {/* View Mode Toggle */}
                            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg self-start sm:self-auto shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                >
                                    <Grid size={16} className="inline-block mr-1.5 -mt-0.5" />
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                >
                                    <List size={16} className="inline-block mr-1.5 -mt-0.5" />
                                    List
                                </button>
                            </div>
                        </div>

                        {/* Category Filters */}
                        {categories.length > 1 && (
                            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Products Display */}
                    <div className="flex flex-col gap-4">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                                {filteredProducts.length > 0 ? filteredProducts.map(p => (
                                    <div key={p._id || p.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-legacy-card cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-legacy-hover animate-fadeIn" onClick={() => router.push(`/feed?type=product&id=${p._id || p.id}&vendorId=${vendorId}`)}>
                                        <div className="relative w-full h-[180px] bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
                                            <Image src={p.image_url?.[0] || '/placeholder.svg'} fill sizes="(max-width: 768px) 50vw, 240px" className="object-cover" alt={p.product_name} />
                                        </div>
                                        <div className="p-4">
                                            <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-1.5 line-clamp-1">{p.product_name}</div>
                                            <div className="text-base font-bold text-amber-400">{formatNaira(p.price)}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="text-5xl mb-3">🍽️</div>
                                        <p className="text-base text-zinc-600 dark:text-zinc-400">No items available in this category.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filteredProducts.length > 0 ? filteredProducts.map(p => (
                                    <div key={p._id || p.id} className="flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 cursor-pointer transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md animate-fadeIn" onClick={() => router.push(`/feed?type=product&id=${p._id || p.id}&vendorId=${vendorId}`)}>
                                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden">
                                            <Image src={p.image_url?.[0] || '/placeholder.svg'} fill sizes="128px" className="object-cover" alt={p.product_name} />
                                        </div>
                                        <div className="flex flex-col flex-grow min-w-0 justify-center">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white line-clamp-2">{p.product_name}</h3>
                                                <span className="text-base sm:text-lg font-bold text-amber-500 whitespace-nowrap">{formatNaira(p.price)}</span>
                                            </div>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 hidden sm:block">
                                                {p.description || "No description provided."}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="text-5xl mb-3">🍽️</div>
                                        <p className="text-base text-zinc-600 dark:text-zinc-400">No items available in this category.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
        </>
    );
}

export default function VendorProfileClient() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading Vendor...</div>}>
            <VendorProfileContent />
        </Suspense>
    );
}
