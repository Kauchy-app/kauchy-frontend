"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    onSuccess: () => void;
}

export default function RequestResponseModal({ isOpen, onClose, requestId, onSuccess }: Props) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen && user?.id) {
            fetch(`${API}/products/vendor-products/${user.id}`)
                .then(r => r.ok ? r.json() : [])
                .then(data => setProducts(data))
                .catch(err => console.error(err));
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) {
            showToast("Please select a product first", 'error');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API}/products/requests/${requestId}/respond/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.access}`
                },
                body: JSON.stringify({ product_id: selectedProduct, message })
            });

            if (res.ok) {
                showToast('Response sent successfully!', 'success');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to send response.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Something went wrong.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Respond to Request</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Select a product from your inventory</label>
                        {products.length === 0 ? (
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center text-sm text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                You don't have any products yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                                {products.map(p => (
                                    <div 
                                        key={p.id}
                                        onClick={() => setSelectedProduct(p.id)}
                                        className={`cursor-pointer rounded-xl border-2 p-2 transition-all ${selectedProduct === p.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'}`}
                                    >
                                        <div className="w-full h-24 relative rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2">
                                            {p.image_url && p.image_url.length > 0 && (
                                                <Image src={p.image_url[0]} alt={p.product_name} fill className="object-cover" />
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{p.product_name}</p>
                                        <p className="text-xs text-zinc-500 font-semibold">₦{Number(p.price).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Add a message (Optional)</label>
                        <textarea 
                            rows={3}
                            placeholder="Hey! I have exactly what you're looking for..."
                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>
                </form>

                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading || !selectedProduct} className={`px-8 py-2.5 rounded-full font-semibold text-white transition-colors flex items-center justify-center min-w-[120px] ${!selectedProduct ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Suggestion'}
                    </button>
                </div>
            </div>
        </div>
    );
}
