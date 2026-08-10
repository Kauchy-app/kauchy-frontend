"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateRequestModal({ isOpen, onClose, onSuccess }: Props) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        item_name: '',
        category: 'Fashion',
        description: '',
        budget: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('item_name', formData.item_name);
            submitData.append('category', formData.category);
            submitData.append('description', formData.description);
            if (formData.budget) submitData.append('budget', formData.budget);
            if (imageFile) submitData.append('image', imageFile);

            const res = await fetch(`${API}/products/requests/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.access}`
                },
                body: submitData
            });

            if (res.ok) {
                showToast('Request posted successfully!', 'success');
                onSuccess();
                onClose();
            } else {
                showToast('Failed to post request.', 'error');
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
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post a Request</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
                            <input 
                                type="text"
                                required
                                placeholder="e.g. Nike Air Force 1"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                value={formData.item_name}
                                onChange={e => setFormData({...formData, item_name: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select 
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="Fashion">Fashion</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Home">Home</option>
                                <option value="Beauty">Beauty</option>
                                <option value="Sports">Sports</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description (Be specific!)</label>
                            <textarea 
                                required
                                rows={3}
                                placeholder="Size 10, Red, brand new if possible."
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Budget (₦) Optional</label>
                                <input 
                                    type="number"
                                    placeholder="50000"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    value={formData.budget}
                                    onChange={e => setFormData({...formData, budget: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Image (Optional)</label>
                                <input 
                                    type="file"
                                    accept="image/*"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-700 dark:file:text-gray-300"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImageFile(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-full font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center min-w-[120px]">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Post Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
