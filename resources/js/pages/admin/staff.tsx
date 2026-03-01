import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PaginationLinks } from '@/components/pagination-links';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { PaginatedData, StaffData, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { StaffModal, DeleteStaffModal } from './partials/staff';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Staff', href: route('staff.list') },
];

interface StaffPageProps {
    staff: PaginatedData<StaffData>;
    roles: { id: number; name: string }[];
}

export default function Staff({ staff, roles }: StaffPageProps) {

    const [onOpen, setOnOpen] = useState(false);
    const [editing, setEditing] = useState<StaffData | null>(null);
    const [deleting, setDeleting] = useState<StaffData | null>(null);
    const [onDeleteOpen, setOnDeleteOpen] = useState(false);
    const { can } = usePermissions();

    const roleNames = roles.map(r => r.name);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff" />
            <StaffModal onOpen={onOpen} setOnOpen={setOnOpen} editing={editing} roles={roleNames} />
            <DeleteStaffModal onOpen={onDeleteOpen} setOnOpen={setOnDeleteOpen} editing={deleting} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 print:px-1 print:py-2 max-w-5xl 2xl:max-w-7xl">
                {can('staff.manage') && (
                    <div className="flex justify-end items-center print:hidden">
                        <Button variant="default" onClick={() => { setOnOpen(true); setEditing(null); }}>
                            Add staff
                        </Button>
                    </div>
                )}
                <div className='overflow-auto border print:border-gray-700 rounded-lg text-sm'>
                    <table className='w-full'>
                        <thead>
                            <tr className='border-b'>
                                <th className='text-end p-2'>#</th>
                                <th className='p-2'>Name</th>
                                <th className='p-2'>Username</th>
                                <th className='p-2'>Phone</th>
                                <th className='p-2'>Role</th>
                                <th className='p-2'></th>
                            </tr>
                        </thead>
                        <tbody>
                        {staff.data.map((data: StaffData, i: number) => (
                            <tr key={data.id} className='hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t'>
                                <td className='px-4 py-2.5 w-4 text-end border-e'>{(staff.from || 0) + i}</td>
                                <td className='px-2 py-2.5'>{ data.name }</td>
                                <td className='px-2 py-2.5'>{ data.username }</td>
                                <td className='px-2 py-2.5'>{ data.phone }</td>
                                <td className='px-2 py-2.5'>
                                    {data.roles?.[0]?.name ? (
                                        <span className='inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium'>
                                            {data.roles[0].name.charAt(0).toUpperCase() + data.roles[0].name.slice(1)}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className='px-2 py-2.5 text-end print:hidden'>
                                    {can('staff.manage') && (
                                        <div className="flex items-center justify-end gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                                            setEditing(data);
                                                            setOnOpen(true);
                                                        }}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                                                            setDeleting(data);
                                                            setOnDeleteOpen(true);
                                                        }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!staff.data.length && (
                            <tr>
                                <td className='!p-4 !text-center' colSpan={6}>No data available</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={staff} />
            </div>
        </AppLayout>
    );
}
