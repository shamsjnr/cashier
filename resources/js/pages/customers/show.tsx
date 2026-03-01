import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { CustomerData, PaginatedData, Receipt, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Customers', href: route('customer.list') },
    { title: 'Customer Details', href: '#' },
];

export default function CustomerShow({ customer, receipts }: { customer: CustomerData; receipts: PaginatedData<Receipt> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-4xl 2xl:max-w-7xl">
                <div className="border rounded-xl p-4 space-y-2">
                    <h2 className="text-xl font-semibold">{customer.name}</h2>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Phone: {customer.phone || 'N/A'}</div>
                        <div>Email: {customer.email || 'N/A'}</div>
                        <div>Address: {customer.address || 'N/A'}</div>
                        <div>Total Purchases: {customer.receipts_count ?? 0}</div>
                    </div>
                    {customer.notes && <div className="text-sm italic">{customer.notes}</div>}
                </div>

                <h3 className="text-lg font-semibold">Purchase History</h3>
                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">Receipt #</th>
                                <th className="text-start p-2">Date</th>
                                <th className="text-end p-2">Total</th>
                                <th className="text-start p-2">Payment</th>
                                <th className="text-start p-2">Cashier</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipts.data.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-2 py-2.5">{r.receipt_number || `#${r.id}`}</td>
                                    <td className="px-2 py-2.5">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="px-2 py-2.5 text-end">
                                        <span className="text-gray-500 line-through decoration-double">N</span>
                                        {Number(r.total || 0).toLocaleString()}
                                    </td>
                                    <td className="px-2 py-2.5 capitalize">{r.payment_method}</td>
                                    <td className="px-2 py-2.5">{r.user?.name}</td>
                                </tr>
                            ))}
                            {!receipts.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={5}>No purchase history</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={receipts} />
            </div>
        </AppLayout>
    );
}
