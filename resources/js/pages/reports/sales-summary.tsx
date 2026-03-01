import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ReportFilters } from './partials/report-filters';
import { SummaryCard } from './partials/summary-card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: route('reports.index') },
    { title: 'Sales Summary', href: route('reports.sales') },
];

interface SalesData {
    period: string;
    receipt_count: number;
    revenue: number;
}

export default function SalesSummary({ data, totals, filters }: { data: SalesData[]; totals: { total_receipts: number; total_revenue: number; avg_receipt: number }; filters: { date_from: string; date_to: string; group_by: string } }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Summary" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-6xl 2xl:max-w-7xl">
                <ReportFilters filters={filters} routeName="reports.sales" exportSlug="sales-summary" />

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard label="Total Revenue" value={`\u20A6${Number(totals.total_revenue).toLocaleString()}`} />
                    <SummaryCard label="Total Receipts" value={totals.total_receipts} />
                    <SummaryCard label="Avg. Receipt Value" value={`\u20A6${Number(totals.avg_receipt).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                </div>

                <div className="border rounded-xl p-4" style={{ height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(v) => v.toLocaleString()} />
                            <Tooltip formatter={(v: number) => [`\u20A6${v.toLocaleString()}`, 'Revenue']} />
                            <Bar dataKey="revenue" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">Period</th>
                                <th className="text-end p-2">Receipts</th>
                                <th className="text-end p-2">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.period} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-2 py-2.5">{row.period}</td>
                                    <td className="px-2 py-2.5 text-end">{row.receipt_count}</td>
                                    <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(row.revenue).toLocaleString()}</td>
                                </tr>
                            ))}
                            {!data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={3}>No data for this period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
