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

export const OpenShiftModal = ({ onOpen, setOnOpen }: Props) => {
    const { data, setData, processing, post, reset, errors } = useForm({
        opening_balance: 0,
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('shift.open'), {
            onSuccess: () => { setOnOpen(false); reset(); },
        });
    };

    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title="Open Shift" description="Start a new shift with opening cash balance">
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <Label>Opening Balance (Cash in drawer):</Label>
                    <Input type="number" min="0" step="0.01" value={data.opening_balance} onChange={(e) => setData('opening_balance', Number(e.target.value))} />
                    <InputError message={errors.opening_balance} />
                </div>
                <div className="grid gap-2">
                    <Label>Notes:</Label>
                    <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Optional shift notes..." />
                </div>
                <Button variant="default">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Open Shift
                </Button>
            </form>
        </Modal>
    );
};
