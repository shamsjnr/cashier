import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, ItemData, Receipt } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Chart } from './partials/charts';
import { AlertTriangle, ArrowUpRight, FileText, ShoppingBag, TrendingUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

interface ChartData {
    data: { date: string; amount: number }[];
    labels: string[];
}

interface DashboardProps {
    chart: ChartData;
    margins: { today: number; yesterday: number; profitMargin: number };
    todayStats: { receipts_count: number; total_revenue: number; items_sold: number };
    lowStockItems: ItemData[];
    recentReceipts: (Receipt & { total?: number; payment_method?: string })[];
}

export default function Dashboard({ chart, margins, todayStats, lowStockItems, recentReceipts }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Today's Revenue</span>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold mt-2">
                            <span className="text-gray-500 line-through decoration-double text-lg">N</span>
                            {Number(todayStats?.total_revenue || 0).toLocaleString()}
                        </div>
                        {margins && (
                            <div className={'text-xs mt-1 font-medium ' + (margins.profitMargin >= 0 ? 'text-green-600' : 'text-red-600')}>
                                {margins.profitMargin >= 0 ? '↑' : '↓'} {Math.abs(margins.profitMargin).toFixed(1)}% vs yesterday
                            </div>
                        )}
                    </div>
                    <div className="border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Receipts Today</span>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold mt-2">{todayStats?.receipts_count || 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">transactions processed</div>
                    </div>
                    <div className="border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Items Sold Today</span>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold mt-2">{todayStats?.items_sold || 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">units sold</div>
                    </div>
                </div>

                {/* Chart */}
                <div className="border rounded-xl overflow-hidden" style={{ height: 300 }}>
                    <Chart data={chart?.data} />
                </div>

                {/* Bottom Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Low Stock Alerts */}
                    <div className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                Low Stock Alerts
                            </h3>
                            <Link href={route('inventory.list', { low_stock: '1' })} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                                View all <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {lowStockItems?.length ? lowStockItems.map((item) => (
                                <div key={item.uuid} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                                    <span>{item.name}</span>
                                    <span className="text-red-600 font-medium">{item.stock_quantity} left</span>
                                </div>
                            )) : (
                                <div className="text-sm text-muted-foreground text-center py-4">All items well stocked</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Receipts */}
                    <div className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Recent Receipts</h3>
                            <Link href={route('receipt.list')} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                                View all <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {recentReceipts?.length ? recentReceipts.map((r) => (
                                <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                                    <div>
                                        <span className="font-medium">{r.receipt_number || `#${r.id}`}</span>
                                        <span className="text-muted-foreground ml-2">{r.customer_name}</span>
                                    </div>
                                    <div className="text-end">
                                        <span className="text-gray-500 line-through decoration-double text-xs">N</span>
                                        <span className="font-medium">{Number(r.total || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-sm text-muted-foreground text-center py-4">No receipts yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
