import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { ItemData, PaginatedData, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { StockAdjustmentModal } from './partials/stock-adjustment';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: route('inventory.list') },
];

export default function Inventory({ items, filters }: { items: PaginatedData<ItemData>; filters: { low_stock?: string; search?: string } }) {
    const [adjusting, setAdjusting] = useState<ItemData | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get(route('inventory.list'), { search, low_stock: filters.low_stock }, { preserveState: true });
    };

    const toggleLowStock = () => {
        router.get(route('inventory.list'), { low_stock: filters.low_stock ? '' : '1', search }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <StockAdjustmentModal item={adjusting} onClose={() => setAdjusting(null)} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-5xl 2xl:max-w-7xl">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder="Search items..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-64"
                        />
                        <Button variant={filters.low_stock ? 'default' : 'outline'} size="sm" onClick={toggleLowStock}>
                            Low Stock
                        </Button>
                    </div>
                </div>
                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">#</th>
                                <th className="text-start p-2">Name</th>
                                <th className="text-start p-2">Category</th>
                                <th className="text-end p-2">Stock</th>
                                <th className="text-end p-2">Threshold</th>
                                <th className="text-end p-2">Cost Price</th>
                                <th className="text-end p-2">Sell Price</th>
                                <th className="text-start p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item, i) => {
                                const isLow = item.track_stock && (item.stock_quantity ?? 0) <= (item.low_stock_threshold ?? 5);
                                return (
                                    <tr key={item.uuid} className={'hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t' + (isLow ? ' bg-red-50 dark:bg-red-950/20' : '')}>
                                        <td className="px-4 py-2.5 w-4 text-end border-e">{(items.from || 0) + i}</td>
                                        <td className="px-2 py-2.5">
                                            {item.name}
                                            {!item.track_stock && <span className="ml-1 text-xs text-muted-foreground">(untracked)</span>}
                                        </td>
                                        <td className="px-2 py-2.5">
                                            {item.category ? (
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: item.category.color + '20', color: item.category.color }}>
                                                    {item.category.name}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className={'px-2 py-2.5 text-end font-medium' + (isLow ? ' text-red-600 dark:text-red-400' : '')}>
                                            {item.track_stock ? item.stock_quantity : '-'}
                                        </td>
                                        <td className="px-2 py-2.5 text-end">{item.track_stock ? item.low_stock_threshold : '-'}</td>
                                        <td className="px-2 py-2.5 text-end">{Number(item.cost_price || 0).toLocaleString()}</td>
                                        <td className="px-2 py-2.5 text-end">{Number(item.price).toLocaleString()}</td>
                                        <td className="px-2 py-2.5 space-x-1 !text-end">
                                            {item.track_stock && (
                                                <Button className="cursor-pointer" size="sm" variant="secondary" onClick={() => setAdjusting(item)}>
                                                    Adjust
                                                </Button>
                                            )}
                                            <Link href={route('inventory.movements', { item: item.uuid })}>
                                                <Button className="cursor-pointer" size="sm" variant="outline">History</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!items.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={8}>No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={items} />
            </div>
        </AppLayout>
    );
}
