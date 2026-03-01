import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ItemData } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface StockAdjustmentModalProps {
    item: ItemData | null;
    onClose: () => void;
}

export const StockAdjustmentModal = ({ item, onClose }: StockAdjustmentModalProps) => {
    const { data, setData, processing, post, reset, errors } = useForm({
        quantity: 0,
        type: 'purchase',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!item?.uuid) return;
        post(route('inventory.adjust', { item: item.uuid }), {
            onSuccess: () => { onClose(); reset(); },
        });
    };

    useEffect(() => {
        if (!item) reset();
    }, [item]);

    return (
        <Modal onOpen={!!item} onClose={() => onClose()} title="Adjust Stock" description={`Adjust stock for ${item?.name || ''}`}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="text-sm text-muted-foreground">
                    Current stock: <b>{item?.stock_quantity ?? 0}</b>
                </div>
                <div className="grid gap-2">
                    <Label>Quantity (positive to add, negative to remove):</Label>
                    <Input type="number" value={data.quantity} onChange={(e) => setData('quantity', Number(e.target.value))} />
                    <InputError message={errors.quantity} />
                </div>
                <div className="grid gap-2">
                    <Label>Type:</Label>
                    <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                    >
                        <option value="purchase">Purchase / Restock</option>
                        <option value="adjustment">Manual Adjustment</option>
                        <option value="return">Return</option>
                    </select>
                    <InputError message={errors.type} />
                </div>
                <div className="grid gap-2">
                    <Label>Notes:</Label>
                    <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Optional notes..." />
                </div>
                <Button variant="default">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Adjust Stock
                </Button>
            </form>
        </Modal>
    );
};
