import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { ExpenseData, PaginatedData, type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ExpenseModal, DeleteExpenseModal } from './partials/expense-modal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Expenses', href: route('expense.list') },
];

export default function Expenses({ expenses, filters, expenseCategories }: { expenses: PaginatedData<ExpenseData>; filters: { date_from?: string; date_to?: string; category?: string }; expenseCategories: string[] }) {
    const [onOpen, setOnOpen] = useState(false);
    const [editing, setEditing] = useState<ExpenseData | null>(null);
    const [deleting, setDeleting] = useState<ExpenseData | null>(null);
    const [onDeleteOpen, setOnDeleteOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const applyFilters = () => {
        router.get(route('expense.list'), { date_from: dateFrom, date_to: dateTo, category: filters.category }, { preserveState: true });
    };

    const total = expenses.data.reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
            <ExpenseModal onOpen={onOpen} setOnOpen={setOnOpen} editing={editing} expenseCategories={expenseCategories} />
            <DeleteExpenseModal onOpen={onDeleteOpen} setOnOpen={setOnDeleteOpen} editing={deleting} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-5xl 2xl:max-w-7xl">
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                        <input type="date" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        <span className="text-sm">to</span>
                        <input type="date" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        <Button variant="outline" size="sm" onClick={applyFilters}>Filter</Button>
                    </div>
                    <Button variant="default" onClick={() => { setOnOpen(true); setEditing(null); }}>
                        Add expense
                    </Button>
                </div>

                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-end p-2">#</th>
                                <th className="p-2">Title</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Date</th>
                                <th className="text-end p-2">Amount</th>
                                <th className="p-2">By</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.data.map((exp, i) => (
                                <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-4 py-2.5 w-4 text-end border-e">{(expenses.from || 0) + i}</td>
                                    <td className="px-2 py-2.5">{exp.title}</td>
                                    <td className="px-2 py-2.5 capitalize">{exp.category}</td>
                                    <td className="px-2 py-2.5">{new Date(exp.expense_date).toLocaleDateString()}</td>
                                    <td className="px-2 py-2.5 text-end">
                                        <span className="text-gray-500 line-through decoration-double">N</span>
                                        {Number(exp.amount).toLocaleString()}
                                    </td>
                                    <td className="px-2 py-2.5">{exp.user?.name || '-'}</td>
                                    <td className="px-2 py-2.5 text-end">
                                        <div className="flex items-center justify-end gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(exp); setOnOpen(true); }}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleting(exp); setOnDeleteOpen(true); }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {expenses.data.length > 0 && (
                                <tr className="border-t font-semibold bg-gray-50 dark:bg-gray-800/50">
                                    <td colSpan={4} className="px-2 py-2.5 text-end">Total:</td>
                                    <td className="px-2 py-2.5 text-end">
                                        <span className="text-gray-500 line-through decoration-double">N</span>
                                        {total.toLocaleString()}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            )}
                            {!expenses.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={7}>No expenses recorded</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={expenses} />
            </div>
        </AppLayout>
    );
}
