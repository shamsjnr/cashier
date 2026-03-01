import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BarChart3, DollarSign, Package, ShoppingBag, TrendingUp, Users, Wallet } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: route('reports.index') },
];

const reports = [
    { title: 'Sales Summary', description: 'Daily, weekly, and monthly revenue overview', icon: BarChart3, href: 'reports.sales' },
    { title: 'Sales by Item', description: 'Best sellers ranked by quantity and revenue', icon: ShoppingBag, href: 'reports.by-item' },
    { title: 'Sales by Staff', description: 'Cashier performance comparison', icon: Users, href: 'reports.by-staff' },
    { title: 'Profit Report', description: 'Revenue minus costs, margin analysis', icon: TrendingUp, href: 'reports.profit' },
    { title: 'Inventory Report', description: 'Stock levels, values, and low-stock items', icon: Package, href: 'reports.inventory' },
    { title: 'Expense Report', description: 'Expenses by category, revenue vs expenses', icon: Wallet, href: 'reports.expenses' },
];

export default function ReportsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-5xl 2xl:max-w-7xl">
                <h2 className="text-xl font-semibold">Reports</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => (
                        <Link
                            key={report.href}
                            href={route(report.href)}
                            className="border rounded-xl p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                                    <report.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold group-hover:text-primary transition-colors">{report.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
