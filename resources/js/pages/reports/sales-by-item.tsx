import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { PaginatedData, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ReportFilters } from './partials/report-filters';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: route('reports.index') },
    { title: 'Sales by Item', href: route('reports.by-item') },
];

interface ItemSales {
    name: string;
    total_quantity: number;
    total_revenue: number;
}

export default function SalesByItem({ data, filters }: { data: PaginatedData<ItemSales>; filters: { date_from: string; date_to: string } }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales by Item" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-5xl 2xl:max-w-7xl">
                <ReportFilters filters={filters} routeName="reports.by-item" exportSlug="sales-by-item" />

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">#</th>
                                <th className="text-start p-2">Item</th>
                                <th className="text-end p-2">Qty Sold</th>
                                <th className="text-end p-2">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((row, i) => (
                                <tr key={row.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-4 py-2.5 w-4 text-end border-e">{(data.from || 0) + i}</td>
                                    <td className="px-2 py-2.5">{row.name}</td>
                                    <td className="px-2 py-2.5 text-end">{Number(row.total_quantity).toLocaleString()}</td>
                                    <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(row.total_revenue).toLocaleString()}</td>
                                </tr>
                            ))}
                            {!data.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={4}>No data for this period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={data} />
            </div>
        </AppLayout>
    );
}
