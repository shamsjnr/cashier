import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import ModalCentered from '@/components/modal-centered';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StaffData } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface StaffModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: StaffData | null;
    roles: string[];
}

interface DeleteStaffModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: StaffData | null;
}

export const StaffModal = ({ onOpen, setOnOpen, editing, roles }: StaffModalProps) => {

    const { data, setData, processing, post, put, reset, errors } = useForm({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'cashier',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editing) {
            put(route('staff.update', {staff: editing}), {
                onSuccess: () => {
                    setOnOpen(false);
                    reset();
                }
            })
        } else {
            post(route('staff.list'), {
                onSuccess: () => {
                    setOnOpen(false);
                    reset();
                }
            })
        }
    }

    useEffect(() => {
        if (editing) {
            setData({
                name: editing.name,
                username: editing.username || '',
                email: editing.email || '',
                phone: editing.phone,
                password: '',
                role: editing.roles?.[0]?.name || editing.role || 'cashier',
            });
        }
        return () => {
            reset();
        }
    }, [editing]);

    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title={ (editing ? 'Update' : 'Add') + ' Staff'} description='Input staff details'>
            <form onSubmit={submit} className='flex flex-col gap-4'>
                <div className='grid gap-2'>
                    <Label>Name:</Label>
                    <Input type='text' name='name' value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} />
                </div>
                <div className='grid gap-2'>
                    <Label>Username:</Label>
                    <Input type='text' name='username' value={data.username} onChange={(e) => setData('username', e.target.value)} />
                    <InputError message={errors.username} />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'>
                        <Label>Email:</Label>
                        <Input type='email' name='email' value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        <InputError message={errors.email} />
                    </div>
                    <div className='grid gap-2'>
                        <Label>Phone:</Label>
                        <Input type='tel' name='phone' maxLength={11} value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        <InputError message={errors.phone} />
                    </div>
                </div>
                <div className='grid gap-2'>
                    <Label>Role:</Label>
                    <select
                        className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                        value={data.role}
                        onChange={(e) => setData('role', e.target.value)}
                    >
                        {roles.map((role) => (
                            <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                        ))}
                    </select>
                    <InputError message={errors.role} />
                </div>
                { ! editing &&
                <div className='grid gap-2'>
                    <Label>Password:</Label>
                    <Input type='password' name='password' value={data.password} onChange={(e) => setData('password', e.target.value)} />
                    <InputError message={errors.password} />
                </div> }
                <Button variant="default">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </form>
        </Modal>
    )
}

export const DeleteStaffModal = ({onOpen, setOnOpen, editing}: DeleteStaffModalProps) => {
    const { delete:remove, processing, } = useForm({
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setOnOpen(false);
        remove(route('staff.update', {staff: editing}), {
            onSuccess: () => {
                setOnOpen(false);
            }
        })
    }

    return (
        <ModalCentered onOpen={onOpen} onClose={setOnOpen} title='Delete Staff'>
            <div className='flex flex-col gap-6'>
                <div className='text-center'>Proceeding will remove <b>{editing?.name}</b> from the system</div>
                <div className="flex justify-end items-center gap-2">
                    <Button variant={'secondary'} onClick={() => setOnOpen(false)}>Cancel</Button>
                    <Button variant={'destructive'} disabled={processing} onClick={submit}>I know, Proceed</Button>
                </div>
            </div>
        </ModalCentered>
    );
}
