import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { ItemData, PaginatedData, StockMovementData, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: route('inventory.list') },
    { title: 'Stock Movements', href: '#' },
];

export default function StockMovements({ item, movements }: { item: ItemData; movements: PaginatedData<StockMovementData> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Movements - ${item.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-4xl 2xl:max-w-7xl">
                <div className="text-lg font-semibold">{item.name} - Stock Movements</div>
                <div className="text-sm text-muted-foreground">Current stock: {item.stock_quantity}</div>

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Date</th>
                                <th className="p-2">Type</th>
                                <th className="text-end p-2">Quantity</th>
                                <th className="p-2">By</th>
                                <th className="p-2">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.data.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-2 py-2.5">{new Date(m.created_at).toLocaleDateString()}</td>
                                    <td className="px-2 py-2.5 capitalize">{m.type}</td>
                                    <td className={'px-2 py-2.5 text-end font-medium ' + (m.quantity > 0 ? 'text-green-600' : 'text-red-600')}>
                                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                                    </td>
                                    <td className="px-2 py-2.5">{m.user?.name || '-'}</td>
                                    <td className="px-2 py-2.5 text-muted-foreground">{m.notes || '-'}</td>
                                </tr>
                            ))}
                            {!movements.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={5}>No movements recorded</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={movements} />
            </div>
        </AppLayout>
    );
}
