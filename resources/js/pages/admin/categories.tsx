import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PaginationLinks } from '@/components/pagination-links';
import AppLayout from '@/layouts/app-layout';
import { CategoryData, PaginatedData, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CategoryModal, DeleteCategoryModal } from './partials/category';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Categories', href: route('category.list') },
];

export default function Categories({ categories }: { categories: PaginatedData<CategoryData> }) {
    const [onOpen, setOnOpen] = useState(false);
    const [editing, setEditing] = useState<CategoryData | null>(null);
    const [deleting, setDeleting] = useState<CategoryData | null>(null);
    const [onDeleteOpen, setOnDeleteOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <CategoryModal onOpen={onOpen} setOnOpen={setOnOpen} editing={editing} />
            <DeleteCategoryModal onOpen={onDeleteOpen} setOnOpen={setOnDeleteOpen} editing={deleting} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-4xl 2xl:max-w-7xl">
                <div className="flex justify-end items-center">
                    <Button variant="default" onClick={() => { setOnOpen(true); setEditing(null); }}>
                        Add category
                    </Button>
                </div>
                <div className="overflow-auto border rounded-lg text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-end p-2">#</th>
                                <th className="p-2">Name</th>
                                <th className="p-2">Color</th>
                                <th className="p-2">Items</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.data.map((data, i) => (
                                <tr key={data.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-500/10 border-t">
                                    <td className="px-4 py-2.5 w-4 text-end border-e">{(categories.from || 0) + i}</td>
                                    <td className="px-2 py-2.5">{data.name}</td>
                                    <td className="px-2 py-2.5">
                                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: data.color + '20', color: data.color }}>
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }}></span>
                                            {data.color}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2.5">{data.items_count ?? 0}</td>
                                    <td className="px-2 py-2.5 text-end">
                                        <div className="flex items-center justify-end gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(data); setOnOpen(true); }}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleting(data); setOnDeleteOpen(true); }}>
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
                            {!categories.data.length && (
                                <tr><td className="!p-4 !text-center" colSpan={5}>No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationLinks data={categories} />
            </div>
        </AppLayout>
    );
}
