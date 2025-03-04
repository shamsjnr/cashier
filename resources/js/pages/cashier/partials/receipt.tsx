import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import ModalCentered from '@/components/modal-centered';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface ReceiptModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: Receipt | null;
}

export const ReceiptModal = ({ onOpen, setOnOpen, editing }: ReceiptModalProps) => {

    const { data, setData, processing, post, put, reset, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editing) {
            put(route('Receipt.update', {Receipt: editing}), {
                onSuccess: () => {
                    setOnOpen(false);
                    reset();
                }
            })
        } else {
            post(route('Receipt.list'), {
                onSuccess: () => {
                    setOnOpen(false);
                    reset();
                }
            })
        }
    }

    useEffect(() => {
        if (editing) {
            setData('name', editing.name);
            setData('email', editing.email || '');
            setData('phone', editing.phone);
            setData('password', editing.password || '');
        }
        return () => {
            setData({
                name: '',
                email: '',
                phone: '',
                password: '',
            })
        }
    }, [editing]);

    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title={ (editing ? 'Update' : 'Add') + ' Receipt'} description='Input Receipt details'>
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

export const DeleteReceiptModal = ({onOpen, setOnOpen, editing}: ReceiptModalProps) => {
    const { delete:remove, processing, } = useForm({
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        console.log("In here!");
        setOnOpen(false);
        remove(route('Receipt.update', {Receipt: editing}), {
            onSuccess: () => {
                setOnOpen(false);
            }
        })
    }

    return (
        <ModalCentered onOpen={onOpen} onClose={setOnOpen} title='Delete Receipt'>
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
