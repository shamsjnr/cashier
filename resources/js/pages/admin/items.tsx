import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PaginationLinks } from '@/components/pagination-links';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { CategoryData, ItemData, PaginatedData, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Pencil, Trash2, PackagePlus, History } from 'lucide-react';
import { ItemModal, DeleteItemModal } from './partials/item';
import { StockAdjustmentModal } from './partials/stock-adjustment';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Items', href: route('item.list') },
];

interface ItemsPageProps {
    items: PaginatedData<ItemData>;
    categories: CategoryData[];
    filters: { search?: string; low_stock?: string };
}

export default function Items({ items, categories, filters = {} }: ItemsPageProps) {
    const [onOpen, setOnOpen] = useState(false);
    const [editing, setEditing] = useState<ItemData | null>(null);
    const [deleting, setDeleting] = useState<ItemData | null>(null);
    const [onDeleteOpen, setOnDeleteOpen] = useState(false);
    const [adjusting, setAdjusting] = useState<ItemData | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const { can } = usePermissions();

    const handleSearch = () => {
        router.get(route('item.list'), { search, low_stock: filters.low_stock || '' }, { preserveState: true });
    };

    const toggleLowStock = () => {
        router.get(route('item.list'), { low_stock: filters.low_stock ? '' : '1', search }, { preserveState: true });
    };

    const colCount = 5 + (can('inventory.manage') ? 1 : 0) + 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Items" />
            <ItemModal onOpen={onOpen} setOnOpen={setOnOpen} editing={editing} categories={categories} />
            <DeleteItemModal onOpen={onDeleteOpen} setOnOpen={setOnDeleteOpen} editing={deleting} />
            <StockAdjustmentModal item={adjusting} onClose={() => setAdjusting(null)} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 print:px-1 print:py-2 max-w-5xl 2xl:max-w-7xl">
                <div className="flex justify-between items-center gap-2 print:hidden">
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
                    {can('items.create') && (
                        <Button variant="default" onClick={() => { setOnOpen(true); setEditing(null); }}>
                            Add item
                        </Button>
                    )}
                </div>
                <div className="overflow-auto border print:border-gray-700 rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-end px-2 py-2 border-e w-4">#</th>
                                <th className="text-start px-2 py-2">Name</th>
                                <th className="text-start px-2 py-2">Category</th>
                                <th className="text-end px-2 py-2">Price</th>
                                {can('inventory.manage') && (
                                    <th className="text-end px-2 py-2">Cost</th>
                                )}
                                <th className="text-end px-2 py-2">Stock</th>
                                <th className="text-end px-2 py-2 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item: ItemData, i: number) => {
                                const isLow = item.track_stock && (item.stock_quantity ?? 0) <= (item.low_stock_threshold ?? 5);
                                return (
                                    <tr
                                        key={item.uuid || i}
                                        className={
                                            'hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t' +
                                            (isLow ? ' bg-red-50 dark:bg-red-950/20' : '')
                                        }
                                    >
                                        <td className="text-end px-2 py-2.5 w-4 border-e">{(items.from || 0) + i}</td>
                                        <td className="px-2 py-2.5">{item.name}</td>
                                        <td className="px-2 py-2.5">
                                            {item.category ? (
                                                <span
                                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                                                    style={{ backgroundColor: item.category.color + '20', color: item.category.color }}
                                                >
                                                    {item.category.name}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-2 py-2.5 text-end">{Number(item.price).toLocaleString()}</td>
                                        {can('inventory.manage') && (
                                            <td className="px-2 py-2.5 text-end">{Number(item.cost_price || 0).toLocaleString()}</td>
                                        )}
                                        <td className={'px-2 py-2.5 text-end' + (isLow ? ' font-medium text-red-600 dark:text-red-400' : '')}>
                                            {item.track_stock ? item.stock_quantity : <span className="text-muted-foreground">-</span>}
                                        </td>
                                        <td className="px-2 py-2.5 text-end print:hidden">
                                            <div className="flex items-center justify-end gap-0.5">
                                                {can('items.edit') && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(item); setOnOpen(true); }}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit item</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                {can('items.delete') && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleting(item); setOnDeleteOpen(true); }}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete item</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                {item.track_stock && can('inventory.manage') && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAdjusting(item)}>
                                                                    <PackagePlus className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Adjust stock</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                {item.track_stock && can('inventory.manage') && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link href={route('inventory.movements', { item: item.uuid })}>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                                                        <History className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Stock history</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!items.data.length && (
                                <tr>
                                    <td className="!p-4 !text-center" colSpan={colCount}>No data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={items} />
            </div>
        </AppLayout>
    );
}
