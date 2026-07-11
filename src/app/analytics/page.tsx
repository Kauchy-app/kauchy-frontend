"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthWall } from '@/context/AuthGateContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899'];

export default function AnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [stats, setStats] = useState<any>({
        total_sales_quantity: 0,
        total_revenue: 0,
        total_views: 0,
        rating: 0,
        active_products_count: 0
    });
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Canvas refs for charts
    const salesChartRef = useRef<HTMLCanvasElement>(null);
    const categoryChartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (user) {
            if ((user?.user?.role || user?.role) !== 'vendor') {
                showToast("Only vendors can access analytics", "error");
                router.push('/');
                return;
            }
            loadAnalytics();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Re-draw charts once the canvases have a real layout size, and on any resize.
    // ResizeObserver fires immediately on observe, so this also covers first paint.
    useEffect(() => {
        if (loading) return;
        const canvases = [salesChartRef.current, categoryChartRef.current].filter(Boolean) as HTMLCanvasElement[];
        if (canvases.length === 0) return;
        const ro = new ResizeObserver(() => drawCharts());
        canvases.forEach(c => ro.observe(c));
        return () => ro.disconnect();
    }, [loading, topProducts]);

    const loadAnalytics = async () => {
        const headers = { Authorization: `Bearer ${user.access}` };
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/overview/`, { headers });
            if (res.ok) {
                const data = await res.json();
                setStats(data || {});
            }

            // Top Products
            const resTop = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/top-products-vendor/`, { headers });
            if (resTop.ok) {
                const top = await resTop.json();
                setTopProducts(Array.isArray(top) ? top : []);
            }

            // Recent Orders — real vendor orders, latest first
            const resOrders = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my_orders/`, { headers });
            if (resOrders.ok) {
                const orders = await resOrders.json();
                const myName = user?.user?.username || user?.username;
                const vendorOrders = (Array.isArray(orders) ? orders : [])
                    .filter((o: any) => !myName || o.vendor_username === myName)
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5);
                setRecentOrders(vendorOrders);
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to load analytics data", "error");
        } finally {
            setLoading(false);
        }
    };

    // Prepare a canvas for crisp rendering on HiDPI screens and return a scaled context.
    const setupCanvas = (canvas: HTMLCanvasElement) => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null; // not laid out yet — RO will re-fire
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);
        return { ctx, w: rect.width, h: rect.height };
    };

    const drawEmpty = (ctx: CanvasRenderingContext2D, w: number, h: number, muted: string) => {
        ctx.fillStyle = muted;
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet', w / 2, h / 2);
        ctx.textAlign = 'start';
    };

    const drawCharts = () => {
        const isDark = document.documentElement.classList.contains('dark');
        const muted = isDark ? '#a1a1aa' : '#6b7280';

        // Sales Overview — top products by units sold
        if (salesChartRef.current) {
            const setup = setupCanvas(salesChartRef.current);
            if (setup) {
                const { ctx, w, h } = setup;
                const items = topProducts.slice(0, 6);
                if (items.length === 0) {
                    drawEmpty(ctx, w, h, muted);
                } else {
                    const data = items.map(p => Number(p.units_sold) || 0);
                    const labels = items.map(p => (p.product_name || p.name || '—').toString());
                    const maxVal = Math.max(...data, 1);
                    const padBottom = 22;
                    const barW = w / data.length;

                    data.forEach((val, i) => {
                        const barH = (val / maxVal) * (h - padBottom - 10);
                        const x = i * barW + barW * 0.2;
                        const bw = barW * 0.6;
                        ctx.fillStyle = '#6366f1';
                        ctx.fillRect(x, h - barH - padBottom, bw, barH);

                        ctx.fillStyle = muted;
                        ctx.font = '11px sans-serif';
                        ctx.textAlign = 'center';
                        const label = labels[i].length > 8 ? labels[i].slice(0, 7) + '…' : labels[i];
                        ctx.fillText(label, x + bw / 2, h - 6);
                        ctx.fillText(String(val), x + bw / 2, h - barH - padBottom - 4);
                    });
                    ctx.textAlign = 'start';
                }
            }
        }

        // Category Dist. — top products by revenue share
        if (categoryChartRef.current) {
            const setup = setupCanvas(categoryChartRef.current);
            if (setup) {
                const { ctx, w, h } = setup;
                const items = topProducts.slice(0, PIE_COLORS.length);
                const data = items.map(p => Number(p.revenue) || 0);
                const total = data.reduce((a, b) => a + b, 0);
                if (total <= 0) {
                    drawEmpty(ctx, w, h, muted);
                } else {
                    const cx = w / 2;
                    const cy = h / 2;
                    const r = Math.min(cx, cy) - 10;
                    let startAngle = -Math.PI / 2;
                    data.forEach((val, i) => {
                        const sliceAngle = (val / total) * 2 * Math.PI;
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
                        ctx.closePath();
                        ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
                        ctx.fill();
                        startAngle += sliceAngle;
                    });
                }
            }
        }
    };

    if (!user) return <AuthWall reason="view your analytics" loading={authLoading} />;

    const money = (v: any) => `₦${(Number(v) || 0).toLocaleString()}`;

    return (
        <div className="p-4 sm:p-8 bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Analytics Dashboard</h1>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
            ) : (
            <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow hover:shadow-lg transition">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Revenue</h3>
                    <p className="text-3xl font-bold text-blue-600">{money(stats.total_revenue)}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow hover:shadow-lg transition">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium">Items Sold</h3>
                    <p className="text-3xl font-bold text-blue-600">{(Number(stats.total_sales_quantity) || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow hover:shadow-lg transition">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium">Profile Views</h3>
                    <p className="text-3xl font-bold text-blue-600">{(Number(stats.total_views) || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow hover:shadow-lg transition">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium">Rating</h3>
                    <p className="text-3xl font-bold text-yellow-500">★ {stats.rating ? parseFloat(stats.rating).toFixed(1) : "N/A"}</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-300">Top Products by Units Sold</h3>
                    <canvas ref={salesChartRef} className="w-full block" style={{ height: 220 }}></canvas>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-300">Revenue by Product</h3>
                    <canvas ref={categoryChartRef} className="w-full block" style={{ height: 220 }}></canvas>
                </div>
            </div>

            {/* Lists Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-300">Top Products</h3>
                    <div className="overflow-auto max-h-60">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 dark:bg-zinc-800 font-medium text-gray-600 dark:text-gray-400">
                                <tr>
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Sold</th>
                                    <th className="p-2 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((p: any, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800">
                                        <td className="p-2 truncate max-w-[150px]">{p.product_name || p.name}</td>
                                        <td className="p-2">{p.units_sold}</td>
                                        <td className="p-2 text-right">{money(p.revenue)}</td>
                                    </tr>
                                ))}
                                {topProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-center text-gray-500 dark:text-gray-400">No data found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-300">Recent Orders</h3>
                    <div className="overflow-auto max-h-60">
                        {recentOrders.map((order, i) => {
                            const status = (order.status || '').toString();
                            const isDone = status === 'completed';
                            const isPending = status === 'pending';
                            const isFailed = status === 'expired';
                            return (
                                <div key={order.id ?? i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-100">{order.buyer_username || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''} • {order.id}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{money(order.amount)}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${isDone ? 'bg-green-100 dark:bg-green-900/20 text-green-700' :
                                            isPending ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700' :
                                                isFailed ? 'bg-red-100 dark:bg-red-900/20 text-red-700' :
                                                    'bg-blue-100 dark:bg-blue-900/20 text-blue-700'
                                            }`}>{status || '—'}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {recentOrders.length === 0 && (
                            <p className="p-4 text-center text-gray-500 dark:text-gray-400">No recent orders</p>
                        )}
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
