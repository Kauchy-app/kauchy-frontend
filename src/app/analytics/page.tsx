"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthWall } from '@/context/AuthGateContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { formatNairaFixed, formatNaira } from '@/utils/formatCurrency';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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

    if (!user) return <AuthWall reason="view your analytics" loading={authLoading} />;

    const money = formatNairaFixed;

    // Prepare chart data
    const barChartData = topProducts.slice(0, 6).map(p => ({
        name: p.product_name || p.name || '—',
        sold: Number(p.units_sold) || 0
    }));

    const pieChartData = topProducts.slice(0, PIE_COLORS.length).map(p => ({
        name: p.product_name || p.name || '—',
        value: Number(p.revenue) || 0
    }));
    const totalPieValue = pieChartData.reduce((acc, curr) => acc + curr.value, 0);

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const tooltipBg = isDark ? '#18181b' : '#ffffff';
    const tooltipBorder = isDark ? '#27272a' : '#e5e7eb';

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
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow border border-gray-100 dark:border-zinc-800">
                    <h3 className="font-bold text-lg mb-6 text-gray-700 dark:text-gray-300">Top Products by Units Sold</h3>
                    <div style={{ width: '100%', height: 260 }}>
                        {barChartData.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                                    <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip 
                                        cursor={{ fill: isDark ? '#27272a' : '#f3f4f6' }}
                                        contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: textColor }}
                                        itemStyle={{ color: '#6366f1' }}
                                        formatter={(value) => [value, 'Units Sold']}
                                    />
                                    <Bar dataKey="sold" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
                        )}
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow border border-gray-100 dark:border-zinc-800">
                    <h3 className="font-bold text-lg mb-6 text-gray-700 dark:text-gray-300">Revenue by Product</h3>
                    <div style={{ width: '100%', height: 260 }}>
                        {totalPieValue > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: textColor }}
                                        formatter={(value) => [formatNaira(Number(value)), 'Revenue']}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
                        )}
                    </div>
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
