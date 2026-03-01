import AppLayout from '@/layouts/app-layout';
import { ItemData, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { SummaryCard } from './partials/summary-card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: route('reports.index') },
    { title: 'Inventory Report', href: route('reports.inventory') },
];

interface InventoryItem extends ItemData {
    stock_value: number;
    retail_value: number;
}

export default function InventoryReport({ items, totals }: { items: InventoryItem[]; totals: { total_items: number; total_stock: number; stock_value: number; retail_value: number; low_stock_count: number } }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Report" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-6xl 2xl:max-w-7xl">
                <div className="flex justify-end">
                    <a href={route('reports.export.csv', { report: 'inventory' })}>
                        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Export CSV</Button>
                    </a>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    <SummaryCard label="Items Tracked" value={totals.total_items} />
                    <SummaryCard label="Total Units" value={totals.total_stock.toLocaleString()} />
                    <SummaryCard label="Stock Value (Cost)" value={`\u20A6${totals.stock_value.toLocaleString()}`} />
                    <SummaryCard label="Retail Value" value={`\u20A6${totals.retail_value.toLocaleString()}`} />
                    <SummaryCard label="Low Stock Items" value={totals.low_stock_count} />
                </div>

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">Item</th>
                                <th className="text-start p-2">Category</th>
                                <th className="text-end p-2">Stock</th>
                                <th className="text-end p-2">Cost Price</th>
                                <th className="text-end p-2">Sell Price</th>
                                <th className="text-end p-2">Stock Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const isLow = (item.stock_quantity ?? 0) <= (item.low_stock_threshold ?? 5);
                                return (
                                    <tr key={item.uuid} className={'hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t' + (isLow ? ' bg-red-50 dark:bg-red-950/20' : '')}>
                                        <td className="px-2 py-2.5">{item.name}</td>
                                        <td className="px-2 py-2.5">
                                            {item.category ? (
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: item.category.color + '20', color: item.category.color }}>
                                                    {item.category.name}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className={'px-2 py-2.5 text-end font-medium' + (isLow ? ' text-red-600' : '')}>{item.stock_quantity}</td>
                                        <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(item.cost_price || 0).toLocaleString()}</td>
                                        <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(item.price).toLocaleString()}</td>
                                        <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(item.stock_value).toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                            {!items.length && (
                                <tr><td className="!p-4 !text-center" colSpan={6}>No tracked inventory items</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
