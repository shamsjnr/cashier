import { PaginationLinks } from '@/components/pagination-links';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PaginatedData, Receipt } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Receipts', href: route('receipt.list') },
];

interface ReceiptsProps {
    receipts: PaginatedData<Receipt>;
    filters: {
        date_from?: string;
        date_to?: string;
        search?: string;
        payment_method?: string;
    };
}

export default function Receipts({ receipts, filters }: ReceiptsProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');
    const [paymentMethod, setPaymentMethod] = useState(filters?.payment_method || '');

    const applyFilters = () => {
        router.get(route('receipt.list'), {
            search: search || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            payment_method: paymentMethod || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setPaymentMethod('');
        router.get(route('receipt.list'), {}, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Receipts" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 print:px-1 print:py-2 max-w-5xl 2xl:max-w-7xl">
                <div className="flex flex-wrap gap-2 items-end print:hidden">
                    <div className="flex-1 min-w-[180px]">
                        <Input
                            type="text"
                            placeholder="Search by customer or receipt #"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <input type="date" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <input type="date" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <select
                        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                        <option value="">All methods</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="transfer">Transfer</option>
                    </select>
                    <Button variant="default" size="sm" onClick={applyFilters}>Filter</Button>
                    {(dateFrom || dateTo || search || paymentMethod) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
                    )}
                    <div className="ml-auto">
                        <Link
                            className="flex items-center gap-2 px-3 py-2 bg-green-700 text-gray-100 rounded-lg text-sm"
                            href={route('receipt.generate')}
                            prefetch={'hover'}
                        >
                            <Plus className="h-4 w-4" />
                            Generate
                        </Link>
                    </div>
                </div>
                <div className='overflow-auto border print:border-gray-700 rounded-lg text-sm'>
                    <table className='w-full'>
                        <thead>
                            <tr className='border-b'>
                                <th className='text-end p-2'>#</th>
                                <th className='p-2'>Receipt #</th>
                                <th className='p-2'>Customer</th>
                                <th className='text-end p-2'>Total</th>
                                <th className='p-2'>Payment</th>
                                <th className='p-2'>Date</th>
                                <th className='p-2'>Cashier</th>
                                <th className='p-2 print:hidden'></th>
                            </tr>
                        </thead>
                        <tbody>
                        {receipts.data.map((data: Receipt, i: number) => (
                            <tr key={data.id} className='hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t'>
                                <td className='px-4 py-2.5 w-4 text-end border-e'>{(receipts.from || 0) + i}</td>
                                <td className='px-2 py-2.5 font-medium'>{data.receipt_number || `#${data.id}`}</td>
                                <td className='px-2 py-2.5'>{data.customer_name}</td>
                                <td className='px-2 py-2.5 text-end'>
                                    <span className='text-gray-500 line-through decoration-double text-xs'>N</span>
                                    {Number(data.total || 0).toLocaleString()}
                                </td>
                                <td className='px-2 py-2.5'>
                                    <span className='inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs'>
                                        {data.payment_method || 'cash'}
                                    </span>
                                </td>
                                <td className='px-2 py-2.5 text-nowrap'>{new Date(data.created_at).toLocaleDateString()}</td>
                                <td className='px-2 py-2.5'>{data.user?.name}</td>
                                <td className='px-2 py-2.5 text-end print:hidden'>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link href={route('receipt.show', { receipt: data.id })}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent>View receipt</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </td>
                            </tr>
                        ))}
                        {!receipts.data.length && (
                            <tr>
                                <td className='!p-4 !text-center' colSpan={8}>No receipts found</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={receipts} />
            </div>
        </AppLayout>
    );
}
