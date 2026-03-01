import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ReportFilters } from './partials/report-filters';
import { SummaryCard } from './partials/summary-card';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: route('reports.index') },
    { title: 'Expense Report', href: route('reports.expenses') },
];

interface CategoryExpense {
    category: string;
    total: number;
    count: number;
}

export default function ExpenseReport({ byCategory, totals, filters }: { byCategory: CategoryExpense[]; totals: { expenses: number; revenue: number; net: number }; filters: { date_from: string; date_to: string } }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expense Report" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-5xl 2xl:max-w-7xl">
                <ReportFilters filters={filters} routeName="reports.expenses" exportSlug="expenses" />

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard label="Total Revenue" value={`\u20A6${Number(totals.revenue).toLocaleString()}`} />
                    <SummaryCard label="Total Expenses" value={`\u20A6${Number(totals.expenses).toLocaleString()}`} />
                    <SummaryCard label="Net Income" value={`\u20A6${Number(totals.net).toLocaleString()}`} />
                </div>

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">Category</th>
                                <th className="text-end p-2">Entries</th>
                                <th className="text-end p-2">Total</th>
                                <th className="text-end p-2">% of Expenses</th>
                            </tr>
                        </thead>
                        <tbody>
                            {byCategory.map((row) => (
                                <tr key={row.category} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-2 py-2.5 capitalize">{row.category}</td>
                                    <td className="px-2 py-2.5 text-end">{row.count}</td>
                                    <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(row.total).toLocaleString()}</td>
                                    <td className="px-2 py-2.5 text-end">
                                        {totals.expenses > 0 ? ((Number(row.total) / totals.expenses) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                            {!byCategory.length && (
                                <tr><td className="!p-4 !text-center" colSpan={4}>No expenses for this period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
