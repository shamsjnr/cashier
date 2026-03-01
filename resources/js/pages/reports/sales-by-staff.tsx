import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ReportFilters } from './partials/report-filters';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: route('reports.index') },
    { title: 'Sales by Staff', href: route('reports.by-staff') },
];

interface StaffSales {
    staff_name: string;
    staff_id: number;
    receipt_count: number;
    total_revenue: number;
    avg_receipt: number;
}

export default function SalesByStaff({ data, filters }: { data: StaffSales[]; filters: { date_from: string; date_to: string } }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales by Staff" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-5xl 2xl:max-w-7xl">
                <ReportFilters filters={filters} routeName="reports.by-staff" exportSlug="sales-by-staff" />

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">#</th>
                                <th className="text-start p-2">Staff</th>
                                <th className="text-end p-2">Receipts</th>
                                <th className="text-end p-2">Revenue</th>
                                <th className="text-end p-2">Avg. Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={row.staff_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-4 py-2.5 w-4 text-end border-e">{i + 1}</td>
                                    <td className="px-2 py-2.5">{row.staff_name}</td>
                                    <td className="px-2 py-2.5 text-end">{row.receipt_count}</td>
                                    <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(row.total_revenue).toLocaleString()}</td>
                                    <td className="px-2 py-2.5 text-end">{'\u20A6'}{Number(row.avg_receipt).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                            ))}
                            {!data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={5}>No data for this period</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
