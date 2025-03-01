import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import ModalCentered from '@/components/modal-centered';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StaffData } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface staffModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: StaffData | null;
}

export const StaffModal = ({ onOpen, setOnOpen, editing }: staffModalProps) => {

    const { data, setData, processing, post, reset, errors } = useForm({
        name: editing?.name || '',
        email: editing?.email || '',
        phone: editing?.phone || '',
        password: editing?.password || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(editing ? route('staff.update', {id: editing}) : route('staff.list'), {
            onSuccess: () => {
                setOnOpen(false);
                reset();
            }
        })
    }
    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title={ (editing ? 'Update' : 'Add') + ' Staff'} description='Input staff details'>
            <form onSubmit={submit} className='flex flex-col gap-4'>
                <div className='grid gap-2'>
                    <Label>Name:</Label>
                    <Input type='text' name='name' value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} />
                </div>
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

export const DeleteStaffModal = ({onOpen, setOnOpen, editing}: staffModalProps) => {
    const { delete:remove, processing, } = useForm({
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        console.log("In here!");
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
