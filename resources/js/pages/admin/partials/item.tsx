import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import ModalCentered from '@/components/modal-centered';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryData, ItemData } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface ItemModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: ItemData | null;
    categories: CategoryData[];
}

interface DeleteItemModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: ItemData | null;
}

export const ItemModal = ({ onOpen, setOnOpen, editing, categories }: ItemModalProps) => {

    const { data, setData, processing, post, put, reset, errors } = useForm({
        name: '',
        price: 0,
        cost_price: 0,
        category_id: '' as string | number,
        track_stock: false as boolean,
        stock_quantity: 0,
        low_stock_threshold: 5,
        description: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editing) {
            put(route('item.update', {item: editing}), {
                onSuccess: () => {
                    setOnOpen(false);
                    reset();
                }
            })
        } else {
            post(route('item.list'), {
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
                price: editing.price,
                cost_price: editing.cost_price || 0,
                category_id: editing.category_id || '',
                track_stock: editing.track_stock || false,
                stock_quantity: editing.stock_quantity || 0,
                low_stock_threshold: editing.low_stock_threshold || 5,
                description: editing.description || '',
            });
        }
        return () => {
            reset();
        }
    }, [editing]);

    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title={ (editing ? 'Update' : 'Add') + ' Item'} description='Input item details'>
            <form onSubmit={submit} className='flex flex-col gap-4'>
                <div className='grid gap-2'>
                    <Label>Name:</Label>
                    <Input type='text' name='name' value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'>
                        <Label>Price:</Label>
                        <Input type='number' name='price' value={data.price} onChange={(e) => setData('price', Number(e.target.value))} />
                        <InputError message={errors.price} />
                    </div>
                    <div className='grid gap-2'>
                        <Label>Cost Price:</Label>
                        <Input type='number' name='cost_price' value={data.cost_price} onChange={(e) => setData('cost_price', Number(e.target.value))} />
                        <InputError message={errors.cost_price} />
                    </div>
                </div>
                <div className='grid gap-2'>
                    <Label>Category:</Label>
                    <select
                        className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                        value={data.category_id}
                        onChange={(e) => setData('category_id', e.target.value ? Number(e.target.value) : '')}
                    >
                        <option value=''>No category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <InputError message={errors.category_id} />
                </div>
                <div className='grid gap-2'>
                    <Label>Description:</Label>
                    <Input type='text' name='description' value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    <InputError message={errors.description} />
                </div>
                <div className='flex items-center gap-2'>
                    <input
                        type='checkbox'
                        id='track_stock'
                        checked={data.track_stock}
                        onChange={(e) => setData('track_stock', e.target.checked)}
                        className='h-4 w-4 rounded border-gray-300'
                    />
                    <Label htmlFor='track_stock' className='cursor-pointer'>Track stock for this item</Label>
                </div>
                {data.track_stock && (
                    <div className='grid grid-cols-2 gap-3'>
                        <div className='grid gap-2'>
                            <Label>Stock Quantity:</Label>
                            <Input type='number' name='stock_quantity' value={data.stock_quantity} onChange={(e) => setData('stock_quantity', Number(e.target.value))} />
                            <InputError message={errors.stock_quantity} />
                        </div>
                        <div className='grid gap-2'>
                            <Label>Low Stock Alert:</Label>
                            <Input type='number' name='low_stock_threshold' value={data.low_stock_threshold} onChange={(e) => setData('low_stock_threshold', Number(e.target.value))} />
                            <InputError message={errors.low_stock_threshold} />
                        </div>
                    </div>
                )}
                <Button variant="default">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </form>
        </Modal>
    )
}

export const DeleteItemModal = ({onOpen, setOnOpen, editing}: DeleteItemModalProps) => {
    const { delete:remove, processing, } = useForm({
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setOnOpen(false);
        remove(route('item.update', {item: editing}), {
            onSuccess: () => {
                setOnOpen(false);
            }
        })
    }

    return (
        <ModalCentered onOpen={onOpen} onClose={setOnOpen} title='Delete Item'>
            <div className='flex flex-col gap-6'>
                <div className='text-center'>Proceeding will remove <b>{editing?.name}</b> and all related data from the system</div>
                <div className="flex justify-end items-center gap-2">
                    <Button variant={'secondary'} onClick={() => setOnOpen(false)}>Cancel</Button>
                    <Button variant={'destructive'} disabled={processing} onClick={submit}>I know, Proceed</Button>
                </div>
            </div>
        </ModalCentered>
    );
}
