import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import ModalCentered from '@/components/modal-centered';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerData } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface CustomerModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: CustomerData | null;
}

export const CustomerModal = ({ onOpen, setOnOpen, editing }: CustomerModalProps) => {
    const { data, setData, processing, post, put, reset, errors } = useForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('customer.update', { customer: editing.id }), {
                onSuccess: () => { setOnOpen(false); reset(); },
            });
        } else {
            post(route('customer.list'), {
                onSuccess: () => { setOnOpen(false); reset(); },
            });
        }
    };

    useEffect(() => {
        if (editing) {
            setData({
                name: editing.name,
                phone: editing.phone || '',
                email: editing.email || '',
                address: editing.address || '',
                notes: editing.notes || '',
            });
        }
        return () => { reset(); };
    }, [editing]);

    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title={(editing ? 'Update' : 'Add') + ' Customer'} description="Input customer details">
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <Label>Name:</Label>
                    <Input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label>Phone:</Label>
                    <Input type="tel" maxLength={15} value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                    <InputError message={errors.phone} />
                </div>
                <div className="grid gap-2">
                    <Label>Email:</Label>
                    <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    <InputError message={errors.email} />
                </div>
                <div className="grid gap-2">
                    <Label>Address:</Label>
                    <Textarea value={data.address} onChange={(e) => setData('address', e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label>Notes:</Label>
                    <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </div>
                <Button variant="default">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </form>
        </Modal>
    );
};

export const DeleteCustomerModal = ({ onOpen, setOnOpen, editing }: CustomerModalProps) => {
    const { delete: remove, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editing) return;
        remove(route('customer.update', { customer: editing.id }), {
            onSuccess: () => { setOnOpen(false); },
        });
    };

    return (
        <ModalCentered onOpen={onOpen} onClose={setOnOpen} title="Delete Customer">
            <div className="flex flex-col gap-6">
                <div className="text-center">Proceeding will remove <b>{editing?.name}</b> from the system</div>
                <div className="flex justify-end items-center gap-2">
                    <Button variant="secondary" onClick={() => setOnOpen(false)}>Cancel</Button>
                    <Button variant="destructive" disabled={processing} onClick={submit}>I know, Proceed</Button>
                </div>
            </div>
        </ModalCentered>
    );
};
