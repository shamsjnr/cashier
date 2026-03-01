import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { CustomerData, PaginatedData, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CustomerModal, DeleteCustomerModal } from './partials/customer-modal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Customers', href: route('customer.list') },
];

export default function Customers({ customers, filters }: { customers: PaginatedData<CustomerData>; filters: { search?: string } }) {
    const [onOpen, setOnOpen] = useState(false);
    const [editing, setEditing] = useState<CustomerData | null>(null);
    const [deleting, setDeleting] = useState<CustomerData | null>(null);
    const [onDeleteOpen, setOnDeleteOpen] = useState(false);
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get(route('customer.list'), { search }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />
            <CustomerModal onOpen={onOpen} setOnOpen={setOnOpen} editing={editing} />
            <DeleteCustomerModal onOpen={onDeleteOpen} setOnOpen={setOnDeleteOpen} editing={deleting} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-4xl 2xl:max-w-7xl">
                <div className="flex justify-between items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Search customers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-64"
                    />
                    <Button variant="default" onClick={() => { setOnOpen(true); setEditing(null); }}>
                        Add customer
                    </Button>
                </div>
                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-start p-2">#</th>
                                <th className="text-start p-2">Name</th>
                                <th className="text-start p-2">Phone</th>
                                <th className="text-start p-2">Email</th>
                                <th className="text-end p-2">Purchases</th>
                                <th className="text-start p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.map((data, i) => (
                                <tr key={data.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-4 py-2.5 w-4 text-end border-e">{(customers.from || 0) + i}</td>
                                    <td className="px-2 py-2.5">
                                        <Link href={route('customer.show', { customer: data.id })} className="text-blue-600 hover:underline">
                                            {data.name}
                                        </Link>
                                    </td>
                                    <td className="px-2 py-2.5">{data.phone || '-'}</td>
                                    <td className="px-2 py-2.5">{data.email || '-'}</td>
                                    <td className="px-2 py-2.5 text-end">{data.receipts_count ?? 0}</td>
                                    <td className="px-2 py-2.5 space-x-1 !text-end">
                                        <Button className="cursor-pointer" size="sm" variant="secondary" onClick={() => { setEditing(data); setOnOpen(true); }}>Edit</Button>
                                        <Button className="cursor-pointer" size="sm" variant="destructive" onClick={() => { setDeleting(data); setOnDeleteOpen(true); }}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                            {!customers.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={6}>No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={customers} />
            </div>
        </AppLayout>
    );
}
