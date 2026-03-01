import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import ModalCentered from '@/components/modal-centered';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryData } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface CategoryModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: CategoryData | null;
}

export const CategoryModal = ({ onOpen, setOnOpen, editing }: CategoryModalProps) => {
    const { data, setData, processing, post, put, reset, errors } = useForm({
        name: '',
        description: '',
        color: '#6B7280',
        sort_order: 0,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('category.update', { category: editing.id }), {
                onSuccess: () => { setOnOpen(false); reset(); },
            });
        } else {
            post(route('category.list'), {
                onSuccess: () => { setOnOpen(false); reset(); },
            });
        }
    };

    useEffect(() => {
        if (editing) {
            setData({
                name: editing.name,
                description: editing.description || '',
                color: editing.color,
                sort_order: editing.sort_order,
            });
        }
        return () => { reset(); };
    }, [editing]);

    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title={(editing ? 'Update' : 'Add') + ' Category'} description="Input category details">
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <Label>Name:</Label>
                    <Input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label>Description:</Label>
                    <Input type="text" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    <InputError message={errors.description} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Color:</Label>
                        <Input type="color" value={data.color} onChange={(e) => setData('color', e.target.value)} className="h-10 cursor-pointer" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Sort Order:</Label>
                        <Input type="number" value={data.sort_order} onChange={(e) => setData('sort_order', Number(e.target.value))} />
                    </div>
                </div>
                <Button variant="default">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </form>
        </Modal>
    );
};

export const DeleteCategoryModal = ({ onOpen, setOnOpen, editing }: CategoryModalProps) => {
    const { delete: remove, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editing) return;
        remove(route('category.update', { category: editing.id }), {
            onSuccess: () => { setOnOpen(false); },
        });
    };

    return (
        <ModalCentered onOpen={onOpen} onClose={setOnOpen} title="Delete Category">
            <div className="flex flex-col gap-6">
                <div className="text-center">Proceeding will remove <b>{editing?.name}</b> and reassign items to no category</div>
                <div className="flex justify-end items-center gap-2">
                    <Button variant="secondary" onClick={() => setOnOpen(false)}>Cancel</Button>
                    <Button variant="destructive" disabled={processing} onClick={submit}>I know, Proceed</Button>
                </div>
            </div>
        </ModalCentered>
    );
};
