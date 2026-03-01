import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Props {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CloseShiftModal = ({ onOpen, setOnOpen }: Props) => {
    const { data, setData, processing, post, reset, errors } = useForm({
        closing_balance: 0,
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('shift.close'), {
            onSuccess: () => { setOnOpen(false); reset(); },
        });
    };

    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title="Close Shift" description="End your current shift and reconcile cash">
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <Label>Closing Balance (Count cash in drawer):</Label>
                    <Input type="number" min="0" step="0.01" value={data.closing_balance} onChange={(e) => setData('closing_balance', Number(e.target.value))} />
                    <InputError message={errors.closing_balance} />
                </div>
                <div className="grid gap-2">
                    <Label>Notes:</Label>
                    <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="End of shift notes..." />
                </div>
                <Button variant="destructive">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Close Shift
                </Button>
            </form>
        </Modal>
    );
};
