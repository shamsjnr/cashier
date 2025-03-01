import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { StaffData, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { StaffModal, DeleteStaffModal } from './partials/staff';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Staff',
        href: route('staff.list'),
    },
];

export default function Staff({ staff }: {staff: StaffData[]}) {

    const [onOpen, setOnOpen] = useState(false);
    const [editing, setEditing] = useState<StaffData | null>(null);
    const [deleting, setDeleting] = useState<StaffData | null>(null);
    const [onDeleteOpen, setOnDeleteOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff" />
            <StaffModal onOpen={onOpen} setOnOpen={setOnOpen} editing={editing} />
            <DeleteStaffModal onOpen={onDeleteOpen} setOnOpen={setOnDeleteOpen} editing={deleting} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-4xl 2xl:max-w-7xl">
                <div className="flex justify-end items-center">
                    <Button variant="default"
                        onClick={() => {
                            setOnOpen(true)
                            setEditing(null)
                        }}
                    >Add staff</Button>
                </div>
                <div className='overflow-auto border rounded-lg text-sm'>
                    <table className='w-full'>
                        <thead>
                            <tr className='border-b'>
                                <th className='text-start p-2'>#</th>
                                <th className='text-start p-2'>Name</th>
                                <th className='text-start p-2'>Username</th>
                                <th className='text-start p-2'>Phone</th>
                                <th className='text-start p-2'></th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                        staff.map((data: StaffData, i: number) => (
                            <tr key={`staff-${i}`} className='hover:bg-gray-50/50 border-t'>
                                <td className='px-4 py-2.5 w-4 text-end border-e'>{i + 1}</td>
                                <td className='px-2 py-2.5'>{ data.name }</td>
                                <td className='px-2 py-2.5'>{ data.username }</td>
                                <td className='px-2 py-2.5'>{ data.phone }</td>
                                <td className='px-2 py-2.5 space-x-1 text-end'>
                                    <Button className='cursor-pointer' size={'sm'} variant={'secondary'} onClick={() => {
                                        setEditing(data);
                                        setOnOpen(true);
                                    }}>Edit</Button>
                                    <Button
                                        className='cursor-pointer' size={'sm'} variant={'destructive'}
                                        onClick={() => {
                                            setDeleting(data)
                                            setOnDeleteOpen(true)
                                        }}>Delete</Button>
                                </td>
                            </tr>
                        ))
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
