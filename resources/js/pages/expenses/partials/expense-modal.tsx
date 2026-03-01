import InputError from '@/components/input-error';
import Modal from '@/components/modal';
import ModalCentered from '@/components/modal-centered';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExpenseData } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface ExpenseModalProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: ExpenseData | null;
    expenseCategories?: string[];
}

export const ExpenseModal = ({ onOpen, setOnOpen, editing, expenseCategories = [] }: ExpenseModalProps) => {
    const { data, setData, processing, post, put, reset, errors } = useForm({
        title: '',
        description: '',
        amount: 0,
        category: 'general',
        expense_date: new Date().toISOString().split('T')[0],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('expense.update', { expense: editing.id }), {
                onSuccess: () => { setOnOpen(false); reset(); },
            });
        } else {
            post(route('expense.list'), {
                onSuccess: () => { setOnOpen(false); reset(); },
            });
        }
    };

    useEffect(() => {
        if (editing) {
            setData({
                title: editing.title,
                description: editing.description || '',
                amount: editing.amount,
                category: editing.category,
                expense_date: editing.expense_date,
            });
        }
        return () => { reset(); };
    }, [editing]);

    return (
        <Modal onOpen={onOpen} onClose={setOnOpen} title={(editing ? 'Update' : 'Add') + ' Expense'} description="Record an expense">
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                    <Label>Title:</Label>
                    <Input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                    <InputError message={errors.title} />
                </div>
                <div className="grid gap-2">
                    <Label>Amount:</Label>
                    <Input type="number" min="0" step="0.01" value={data.amount} onChange={(e) => setData('amount', Number(e.target.value))} />
                    <InputError message={errors.amount} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Category:</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                        >
                            {expenseCategories.map((cat) => (
                                <option key={cat} value={cat} className="capitalize">{cat}</option>
                            ))}
                        </select>
                        <InputError message={errors.category} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Date:</Label>
                        <Input type="date" value={data.expense_date} onChange={(e) => setData('expense_date', e.target.value)} />
                        <InputError message={errors.expense_date} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>Description:</Label>
                    <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} />
                </div>
                <Button variant="default">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </form>
        </Modal>
    );
};

interface DeleteProps {
    onOpen: boolean;
    setOnOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editing: ExpenseData | null;
}

export const DeleteExpenseModal = ({ onOpen, setOnOpen, editing }: DeleteProps) => {
    const { delete: remove, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editing) return;
        remove(route('expense.update', { expense: editing.id }), {
            onSuccess: () => { setOnOpen(false); },
        });
    };

    return (
        <ModalCentered onOpen={onOpen} onClose={setOnOpen} title="Delete Expense">
            <div className="flex flex-col gap-6">
                <div className="text-center">Proceeding will remove expense <b>{editing?.title}</b></div>
                <div className="flex justify-end items-center gap-2">
                    <Button variant="secondary" onClick={() => setOnOpen(false)}>Cancel</Button>
                    <Button variant="destructive" disabled={processing} onClick={submit}>I know, Proceed</Button>
                </div>
            </div>
        </ModalCentered>
    );
};
