import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { PaginatedData, Receipt, ShiftData, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Shifts', href: route('shift.list') },
    { title: 'Shift Details', href: '#' },
];

export default function ShiftShow({ shift, receipts }: { shift: ShiftData; receipts: PaginatedData<Receipt> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shift Details" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-5xl 2xl:max-w-7xl">
                <div className="border rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Cashier</div>
                        <div className="font-semibold">{shift.user?.name}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Opened</div>
                        <div>{new Date(shift.opened_at).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Closed</div>
                        <div>{shift.closed_at ? new Date(shift.closed_at).toLocaleString() : <span className="text-green-600 font-medium">Active</span>}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Receipts</div>
                        <div className="font-semibold">{shift.receipts_count ?? receipts.total}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Opening Balance</div>
                        <div>₦{Number(shift.opening_balance).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Closing Balance</div>
                        <div>{shift.closing_balance != null ? `₦${Number(shift.closing_balance).toLocaleString()}` : '-'}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Expected</div>
                        <div>{shift.expected_balance != null ? `₦${Number(shift.expected_balance).toLocaleString()}` : '-'}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Difference</div>
                        <div className={shift.difference != null ? (Number(shift.difference) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium') : ''}>
                            {shift.difference != null ? `₦${Number(shift.difference).toLocaleString()}` : '-'}
                        </div>
                    </div>
                </div>
                {shift.notes && <div className="text-sm italic text-muted-foreground">{shift.notes}</div>}

                <h3 className="text-lg font-semibold">Receipts in this Shift</h3>
                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">Receipt #</th>
                                <th className="text-start p-2">Customer</th>
                                <th className="text-end p-2">Total</th>
                                <th className="text-start p-2">Payment</th>
                                <th className="text-start p-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipts.data.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-2 py-2.5">{r.receipt_number || `#${r.id}`}</td>
                                    <td className="px-2 py-2.5">{r.customer_name}</td>
                                    <td className="px-2 py-2.5 text-end">₦{Number(r.total || 0).toLocaleString()}</td>
                                    <td className="px-2 py-2.5 capitalize">{r.payment_method}</td>
                                    <td className="px-2 py-2.5">{new Date(r.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                            {!receipts.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={5}>No receipts in this shift</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={receipts} />
            </div>
        </AppLayout>
    );
}
