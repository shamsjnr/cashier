import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { PaginatedData, ShiftData, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { OpenShiftModal } from './partials/open-shift-modal';
import { CloseShiftModal } from './partials/close-shift-modal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Shifts', href: route('shift.list') },
];

export default function Shifts({ shifts, shiftsEnabled }: { shifts: PaginatedData<ShiftData>; shiftsEnabled: boolean }) {
    const [openModal, setOpenModal] = useState(false);
    const [closeModal, setCloseModal] = useState(false);

    const activeShift = shifts.data.find((s) => !s.closed_at);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shifts" />
            <OpenShiftModal onOpen={openModal} setOnOpen={setOpenModal} />
            <CloseShiftModal onOpen={closeModal} setOnOpen={setCloseModal} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-5xl 2xl:max-w-7xl">
                {!shiftsEnabled && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
                        Shift management is currently disabled. Enable it in system settings to require cashiers to open/close shifts.
                    </div>
                )}

                <div className="flex justify-end items-center gap-2">
                    {activeShift ? (
                        <Button variant="destructive" onClick={() => setCloseModal(true)}>Close Shift</Button>
                    ) : (
                        <Button variant="default" onClick={() => setOpenModal(true)}>Open Shift</Button>
                    )}
                </div>

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-end p-2">#</th>
                                <th className="p-2">Cashier</th>
                                <th className="p-2">Opened</th>
                                <th className="p-2">Closed</th>
                                <th className="text-end p-2">Opening</th>
                                <th className="text-end p-2">Closing</th>
                                <th className="text-end p-2">Diff</th>
                                <th className="text-end p-2">Receipts</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.data.map((shift, i) => (
                                <tr key={shift.id} className={'hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t' + (!shift.closed_at ? ' bg-green-50 dark:bg-green-950/20' : '')}>
                                    <td className="px-4 py-2.5 w-4 text-end border-e">{(shifts.from || 0) + i}</td>
                                    <td className="px-2 py-2.5">{shift.user?.name}</td>
                                    <td className="px-2 py-2.5">{new Date(shift.opened_at).toLocaleString()}</td>
                                    <td className="px-2 py-2.5">
                                        {shift.closed_at ? new Date(shift.closed_at).toLocaleString() : (
                                            <span className="text-green-600 font-medium">Active</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2.5 text-end">{Number(shift.opening_balance).toLocaleString()}</td>
                                    <td className="px-2 py-2.5 text-end">{shift.closing_balance != null ? Number(shift.closing_balance).toLocaleString() : '-'}</td>
                                    <td className={'px-2 py-2.5 text-end font-medium ' + (shift.difference != null ? (Number(shift.difference) >= 0 ? 'text-green-600' : 'text-red-600') : '')}>
                                        {shift.difference != null ? Number(shift.difference).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-2 py-2.5 text-end">{shift.receipts_count ?? 0}</td>
                                    <td className="px-2 py-2.5 text-end">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link href={route('shift.show', { shift: shift.id })}>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent>View</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </td>
                                </tr>
                            ))}
                            {!shifts.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={9}>No shifts recorded</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={shifts} />
            </div>
        </AppLayout>
    );
}
