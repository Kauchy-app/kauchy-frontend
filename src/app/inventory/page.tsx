"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthWall } from '@/context/AuthGateContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { formatNaira } from '@/utils/formatCurrency';

export default function InventoryPage() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [isEditProductOpen, setIsEditProductOpen] = useState(false);
    
    // Delete state
    const [productToDelete, setProductToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Drag & Drop Image States
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isDraggingImages, setIsDraggingImages] = useState(false);

    // Optional custom attributes for a new product (e.g. Size, Colour). Freeform
    // because products vary — vendors add whatever rows make sense.
    const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
    const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
    const updateSpec = (i: number, field: 'key' | 'value', val: string) =>
        setSpecs(prev => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
    const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i));
    
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'food') {
            setSpecs(prev => {
                if (prev.some(s => s.key.toLowerCase() === 'menu')) return prev;
                return [{ key: 'Menu', value: '' }, ...prev];
            });
        }
    };

    // Same custom-attribute rows for the edit modal, seeded from the product.
    const [editSpecs, setEditSpecs] = useState<{ key: string; value: string }[]>([]);
    const addEditSpec = () => setEditSpecs(prev => [...prev, { key: '', value: '' }]);
    const updateEditSpec = (i: number, field: 'key' | 'value', val: string) =>
        setEditSpecs(prev => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
    const removeEditSpec = (i: number) => setEditSpecs(prev => prev.filter((_, idx) => idx !== i));
    
    const handleEditCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'food') {
            setEditSpecs(prev => {
                if (prev.some(s => s.key.toLowerCase() === 'menu')) return prev;
                return [{ key: 'Menu', value: '' }, ...prev];
            });
        }
    };

    const openEditProduct = (p: any) => {
        setEditingProduct(p);
        const entries = p.specs && typeof p.specs === 'object' ? Object.entries(p.specs) : [];
        setEditSpecs(entries.map(([key, value]: any) => ({ key, value: String(value) })));
        setIsEditProductOpen(true);
    };

    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            loadData();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/my_products/`, {
                headers: { Authorization: `Bearer ${user.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const executeDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.access}` }
            });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
                showToast("Product deleted", "success");
            } else {
                showToast("Failed to delete product", "error");
            }
        } catch (e) { showToast("Error deleting product", "error"); }
        finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };

    // Img Drag & Drop
    const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingImages(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addImages(Array.from(e.dataTransfer.files));
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addImages(Array.from(e.target.files));
        }
    };

    const addImages = (files: File[]) => {
        const newFiles = [...selectedImages, ...files];
        setSelectedImages(newFiles);
        setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
    };

    const removeImage = (index: number) => {
        const newFiles = [...selectedImages];
        newFiles.splice(index, 1);
        setSelectedImages(newFiles);
        setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
    };

    // Close and Clear Image Modals
    const closeAddProductModal = () => {
        setIsAddProductOpen(false);
        setSelectedImages([]);
        setImagePreviews([]);
        setSpecs([]);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedImages.length === 0) {
            showToast("At least one image is required", "error");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        if (!formData.get('quantity')) {
            formData.set('quantity', '999'); // default to 999 (infinite) for food/services
        }
        
        formData.delete('image_url');
        selectedImages.forEach(file => {
            formData.append('image_url', file);
        });

        // Collapse the dynamic attribute rows into a {key: value} object.
        const specsObj: Record<string, string> = {};
        specs.forEach(s => {
            const k = s.key.trim();
            const v = s.value.trim();
            if (k && v) specsObj[k] = v;
        });
        formData.append('specs', JSON.stringify(specsObj));

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/create`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.access}` },
                body: formData
            });
            if (res.ok) {
                closeAddProductModal();
                loadData();
                showToast("Product created successfully", "success");
            } else {
                showToast("Failed to create product", "error");
            }
        } catch (err) { showToast("Error creating product", "error"); }
        finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(fd.entries());
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.access}`
                },
                body: JSON.stringify({
                    product_name: data.product_name,
                    description: data.description,
                    price: parseFloat(data.price),
                    quantity: data.quantity ? parseInt(data.quantity) : 999,
                    category: data.category,
                    specs: editSpecs.reduce((acc: Record<string, string>, s) => {
                        const k = s.key.trim(); const v = s.value.trim();
                        if (k && v) acc[k] = v;
                        return acc;
                    }, {}),
                })
            });
            if (res.ok) {
                setIsEditProductOpen(false);
                setEditingProduct(null);
                loadData();
                showToast("Product updated", "success");
            } else { showToast("Failed to update product", "error"); }
        } catch (e) { showToast("Error updating product", "error"); }
        finally { setIsSubmitting(false); }
    };

    if (!user) return <AuthWall reason="manage your inventory" loading={authLoading} />;

    return (
        <div className="container mx-auto px-2.5 py-5 sm:px-5 sm:py-10 w-full max-w-[1400px]">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[#1d1d1d] dark:text-white">Inventory Management</h1>
                <button
                    className="bg-[#1c6ef2] text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:-translate-y-0.5 hover:shadow-md transition-all"
                    onClick={() => setIsAddProductOpen(true)}
                >
                    + Add Product
                </button>
            </div>

            {loading ? <p className="text-center py-10 text-zinc-500 dark:text-zinc-400">Loading...</p> : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-6">
                    {products.map(p => (
                        <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-legacy-card hover:shadow-legacy-hover hover:-translate-y-1 transition-all duration-300">
                            <div className="relative w-full h-40 bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
                                <Image src={p.image_url?.[0] || '/placeholder.svg'} fill sizes="(max-width: 768px) 50vw, 240px" className="object-cover" alt={p.product_name} />
                            </div>
                            <div className="p-4">
                                <div className="font-semibold text-[#1d1d1d] dark:text-white mb-1 truncate">{p.product_name}</div>
                                <div className="text-[#ffb800] font-bold mb-2">{formatNaira(p.price)}</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Qty: {p.quantity} | Views: {p.view_count || 0}</div>
                                <div className="flex gap-2">
                                    <button
                                        className="flex-1 py-1.5 bg-[#1c6ef2] text-white text-xs rounded hover:bg-[#165bbd] transition-colors"
                                        onClick={() => openEditProduct(p)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="flex-1 py-1.5 bg-[#ff4d4d] text-white text-xs rounded hover:bg-[#e63e3e] transition-colors"
                                        onClick={() => setProductToDelete(p)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {products.length === 0 && (
                        <div className="col-span-full text-center py-10 text-zinc-500 dark:text-zinc-400">
                            <div className="text-5xl mb-3">📦</div>
                            <div>No products found. Add one!</div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Delete Confirmation Modal */}
            {productToDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !isDeleting && setProductToDelete(null)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl animate-fadeIn p-6 text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Delete Product</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                            Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-200">"{productToDelete.product_name}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setProductToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeDeleteProduct}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Deleting...</>
                                ) : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {isAddProductOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeAddProductModal}>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#1d1d1d] dark:text-white">Add New Product</h3>
                            <button onClick={closeAddProductModal} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-lg transition-colors">✕</button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            <form id="addProductForm" onSubmit={handleCreateProduct}>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Product Name *</label>
                                    <input name="product_name" required className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500"placeholder="Enter product name" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Description *</label>
                                    <textarea name="description" required className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] min-h-[80px] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500" placeholder="Describe your product"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Price (₦) *</label>
                                        <input name="price" type="number" required placeholder="0.00" step="0.01" min="0" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Quantity <span className="font-normal text-zinc-400">(optional)</span></label>
                                        <input name="quantity" type="number" placeholder="Leave blank if infinite" min="1" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500"/>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Category *</label>
                                    <select name="category" required onChange={handleCategoryChange} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors bg-white dark:bg-zinc-800 text-[#1d1d1d] dark:text-white">
                                        <option value="">Select Category</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="books">Books</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="clothing">Clothing</option>
                                        <option value="sports">Sports</option>
                                        <option value="food">Food</option>
                                        <option value="others">Others</option>
                                    </select>
                                </div>
                                {/* Optional custom attributes — vendors add whatever fits the product */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-semibold text-[#1d1d1d] dark:text-white">Additional details <span className="font-normal text-zinc-400">(optional)</span></label>
                                        <span className="text-xs text-zinc-400">e.g. Size, Colour, Material</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {specs.map((s, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    value={s.key}
                                                    onChange={e => updateSpec(i, 'key', e.target.value)}
                                                    placeholder="Label (e.g. Size)"
                                                    className="w-2/5 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500 text-sm"
                                                />
                                                <input
                                                    value={s.value}
                                                    onChange={e => updateSpec(i, 'value', e.target.value)}
                                                    placeholder="Value (e.g. Medium)"
                                                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeSpec(i)}
                                                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addSpec}
                                            className="self-start mt-1 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-sm font-medium text-[#1c6ef2] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            + Add detail
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Product Images *</label>
                                    <div 
                                        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDraggingImages ? 'border-[#1c6ef2] bg-blue-50 dark:bg-blue-900/20/50' : 'border-zinc-300 dark:border-zinc-700 hover:border-[#1c6ef2] hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                        onDragOver={e => { e.preventDefault(); setIsDraggingImages(true); }}
                                        onDragLeave={() => setIsDraggingImages(false)}
                                        onDrop={handleImageDrop}
                                        onClick={() => imageInputRef.current?.click()}
                                    >
                                        <input type="file" required={selectedImages.length === 0} multiple accept="image/*" ref={imageInputRef} onChange={handleImageSelect} className="hidden" />
                                        <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">📸 Click to upload or drag and drop<br/><span className="text-xs font-normal">You can select multiple images</span></div>
                                    </div>
                                    {/* Image Previews */}
                                    {imagePreviews.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {imagePreviews.map((src, idx) => (
                                                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 group">
                                                    <Image src={src} fill sizes="96px" className="object-cover bg-zinc-50 dark:bg-zinc-800" alt={`Preview ${idx}`} />
                                                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-[#1c6ef2] hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(28,110,242,0.3)] text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {isSubmitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Creating...</> : "Add Product"}
                                    </button>
                                    <button type="button" onClick={closeAddProductModal} disabled={isSubmitting} className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {isEditProductOpen && editingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsEditProductOpen(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#1d1d1d] dark:text-white">Edit Product</h3>
                            <button onClick={() => setIsEditProductOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-lg transition-colors">✕</button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            <form onSubmit={handleUpdateProduct}>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Product Name</label>
                                    <input name="product_name" defaultValue={editingProduct.product_name} required className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500"/>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Description</label>
                                    <textarea name="description" defaultValue={editingProduct.description} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] min-h-[80px] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Price (₦)</label>
                                        <input name="price" type="number" defaultValue={editingProduct.price} required step="0.01" min="0" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Quantity <span className="font-normal text-zinc-400">(optional)</span></label>
                                        <input name="quantity" type="number" defaultValue={editingProduct.quantity} placeholder="Leave blank if infinite" min="1" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500"/>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-1.5 text-[#1d1d1d] dark:text-white">Category</label>
                                    <select name="category" defaultValue={editingProduct.category} required onChange={handleEditCategoryChange} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors bg-white dark:bg-zinc-800 text-[#1d1d1d] dark:text-white">
                                        <option value="electronics">Electronics</option>
                                        <option value="books">Books</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="clothing">Clothing</option>
                                        <option value="sports">Sports</option>
                                        <option value="food">Food</option>
                                        <option value="others">Others</option>
                                    </select>
                                </div>
                                {/* Optional custom attributes */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-semibold text-[#1d1d1d] dark:text-white">Additional details <span className="font-normal text-zinc-400">(optional)</span></label>
                                        <span className="text-xs text-zinc-400">e.g. Size, Colour</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {editSpecs.map((s, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    value={s.key}
                                                    onChange={e => updateEditSpec(i, 'key', e.target.value)}
                                                    placeholder="Label"
                                                    className="w-2/5 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500 text-sm"
                                                />
                                                <input
                                                    value={s.value}
                                                    onChange={e => updateEditSpec(i, 'value', e.target.value)}
                                                    placeholder="Value"
                                                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#1c6ef2] transition-colors text-[#1d1d1d] dark:text-white bg-white dark:bg-zinc-800 dark:placeholder-zinc-500 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeEditSpec(i)}
                                                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addEditSpec}
                                            className="self-start mt-1 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-sm font-medium text-[#1c6ef2] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            + Add detail
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 mb-6 font-medium">
                                    Views: <strong>{editingProduct.view_count || 0}</strong>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-[#1c6ef2] hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(28,110,242,0.3)] text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {isSubmitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Saving...</> : "Save Changes"}
                                    </button>
                                    <button type="button" onClick={() => { setProductToDelete(editingProduct); setIsEditProductOpen(false); }} disabled={isSubmitting} className="w-full py-2.5 bg-[#ff4d4d] hover:bg-[#e63e3e] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Delete Product</button>
                                    <button type="button" onClick={() => setIsEditProductOpen(false)} disabled={isSubmitting} className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Close</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
