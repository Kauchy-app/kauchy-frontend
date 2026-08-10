"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import PageLayout from '@/components/PageLayout';
import { PlusCircle, MessageSquare, Search, Tag, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import CreateRequestModal from '@/components/CreateRequestModal';
import RequestResponseModal from '@/components/RequestResponseModal';

// Dummy implementation for the API url
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ProductRequest = {
    id: string;
    customer_username: string;
    customer_avatar: string;
    item_name: string;
    category: string;
    description: string;
    image_url: string;
    budget: string;
    is_active: boolean;
    created_at: string;
    responses_count: number;
    customer: number;
};

export default function RequestsPage() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [requests, setRequests] = useState<ProductRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    
    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [respondModalData, setRespondModalData] = useState<{isOpen: boolean, requestId: string}>({isOpen: false, requestId: ''});

    const fetchRequests = async () => {
        setLoading(true);
        try {
            let url = `${API}/products/requests/`;
            if (categoryFilter) url += `?category=${categoryFilter}`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [categoryFilter]);

    return (
        <PageLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Requests Board</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Can't find what you're looking for? Request it and let vendors come to you.</p>
                    </div>
                    {user && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shrink-0"
                        >
                            <PlusCircle size={20} />
                            Create Request
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                        onClick={() => setCategoryFilter('')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${!categoryFilter ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'}`}
                    >
                        All Categories
                    </button>
                    {['Fashion', 'Electronics', 'Home', 'Beauty', 'Sports'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${categoryFilter === cat ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-zinc-800/50 rounded-3xl">
                        <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No requests found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Be the first to post a product request in this category!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <Image 
                                            src={req.customer_avatar || 'https://via.placeholder.com/40'} 
                                            alt={req.customer_username} 
                                            width={40} height={40} 
                                            className="rounded-full bg-gray-100 object-cover"
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white leading-tight">@{req.customer_username}</p>
                                            <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                                        <Tag size={12} />
                                        {req.category}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{req.item_name}</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">{req.description}</p>
                                
                                {req.budget && (
                                    <div className="inline-block px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium text-sm rounded-lg mb-4">
                                        Budget: ₦{Number(req.budget).toLocaleString()}
                                    </div>
                                )}
                                
                                {req.image_url && (
                                    <div className="relative w-full h-48 md:h-64 mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800">
                                        <Image src={req.image_url} alt="Reference" fill className="object-cover" />
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800 mt-2">
                                    <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                                        <MessageSquare size={18} />
                                        <span>{req.responses_count} responses</span>
                                    </div>
                                    
                                    {user?.id !== req.customer && (
                                        <button 
                                            onClick={() => setRespondModalData({isOpen: true, requestId: req.id})}
                                            className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full hover:scale-105 transition-transform text-sm"
                                        >
                                            I have this
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <CreateRequestModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={fetchRequests} 
            />
            
            <RequestResponseModal
                isOpen={respondModalData.isOpen}
                onClose={() => setRespondModalData({isOpen: false, requestId: ''})}
                requestId={respondModalData.requestId}
                onSuccess={fetchRequests}
            />
        </PageLayout>
    );
}
