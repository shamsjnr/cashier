import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Receipt } from '@/types';
import { Head, Link, } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Receipts',
        href: route('receipt.list'),
    },
];

export default function Receipts({ receipts }: {receipts: Receipt[]}) {

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Receipts" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 print:px-1 print:py-2 max-w-4xl 2xl:max-w-7xl">
                <div className="flex justify-end items-center print:hidden">
                    <Link className='flex items-center gap-2 px-3 py-2 bg-green-700 text-gray-100 rounded-lg' href={route('receipt.generate')} prefetch={'hover'}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="m19.713 9.128l-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319a4.37 4.37 0 0 0 2.251-2.326l.253-.611a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M6 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5h2v5a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h7v2z" />
                        </svg>
                        Generate
                    </Link>
                </div>
                <div className='overflow-auto border print:border-gray-700 rounded-lg text-sm'>
                            <table className='w-full'>
                                <thead>
                                    <tr className=''>
                                        <th className='text-start py-2 px-2 w-2'>SN</th>
                                        <th className='text-start py-2 px-2'>Customer Name</th>
                                        <th className='text-start py-2 px-2'>Printed at</th>
                                        <th className='text-start py-2 px-3'>By</th>
                                        <th className='text-start py-2 px-3 print:hidden'></th>
                                    </tr>
                                </thead>
                                <tbody>
                                {
                                receipts?.map((data: Receipt, i: number) => (
                                    <tr key={`receipts-${i}`} className='print:border-gray-500 border-t'>
                                        <td className='!px-2 py-2.5 print:py-2 w-4'>{i + 1}</td>
                                        <td className='!px-2 py-2.5 print:py-2'>{ data.customer_name }</td>
                                        <td className='!px-3 py-2.5 print:py-2'>{ data.printed_at }</td>
                                        <td className='!px-3 py-2.5 print:py-2'>{ data.user?.name }</td>
                                        <td className='!px-2 py-2.5 print:py-2 !text-end'>
                                            {/* { Number(data.price).toLocaleString() } */}
                                        </td>
                                    </tr>
                                ))
                                }
                                { ! receipts?.length &&
                                    <tr>
                                        <td className='!p-4 !text-center' colSpan={5}>No data available</td>
                                    </tr>
                                }
                                </tbody>
                            </table>
                        </div>
            </div>
        </AppLayout>
    );
}
