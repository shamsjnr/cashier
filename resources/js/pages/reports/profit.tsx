import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ReportFilters } from './partials/report-filters';
import { SummaryCard } from './partials/summary-card';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: route('reports.index') },
    { title: 'Profit Report', href: route('reports.profit') },
];

interface ProfitItem {
    name: string;
    total_quantity: number;
    total_revenue: number;
    total_cost: number;
    profit: number;
    margin: number;
}

export default function ProfitReport({ data, totals, filters }: { data: ProfitItem[]; totals: { revenue: number; cost: number; profit: number; margin: number }; filters: { date_from: string; date_to: string } }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profit Report" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-6xl 2xl:max-w-7xl">
                <ReportFilters filters={filters} routeName="reports.profit" exportSlug="sales-by-item" />

                <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard label="Revenue" value={`\u20A6${Number(totals.revenue).toLocaleString()}`} />
                    <SummaryCard label="Cost" value={`\u20A6${Number(totals.cost).toLocaleString()}`} />
                    <SummaryCard label="Profit" value={`\u20A6${Number(totals.profit).toLocaleString()}`} />
                    <SummaryCard label="Margin" value={`${totals.margin}%`} />
                </div>

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">Item</th>
                                <th className="text-end p-2">Qty</th>
                                <th className="text-end p-2">Revenue</th>
                                <th className="text-end p-2">Cost</th>
                                <th className="text-end p-2">Profit</th>
                                <th className="text-end p-2">Margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-2 py-2.5">{row.name}</td>
                                    <td className="px-2 py-2.5 text-end">{Number(row.total_quantity).toLocaleString()}</td>
                                    <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(row.total_revenue).toLocaleString()}</td>
                                    <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(row.total_cost).toLocaleString()}</td>
                                    <td className={'px-2 py-2.5 text-end font-medium ' + (row.profit >= 0 ? 'text-green-600' : 'text-red-600')}>
                                        {'\u20A6'}{Number(row.profit).toLocaleString()}
                                    </td>
                                    <td className="px-2 py-2.5 text-end">{row.margin}%</td>
                                </tr>
                            ))}
                            {!data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={6}>No data for this period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
