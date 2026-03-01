import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Receipt, ReceiptAudit } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToWords } from 'to-words';
import { useState } from 'react';
import { ArrowLeft, Printer, Pencil, Check, History, Plus, Trash2, X } from 'lucide-react';

interface ReceiptDetailProps {
    receipt: Receipt;
    canEdit: boolean;
}

export default function ReceiptDetail({ receipt, canEdit }: ReceiptDetailProps) {
    const toWords = new ToWords({ localeCode: 'en-NG' });
    const [editing, setEditing] = useState(false);
    const [finalizing, setFinalizing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Receipts', href: route('receipt.list') },
        { title: receipt.receipt_number || `#${receipt.id}`, href: route('receipt.show', { receipt: receipt.id }) },
    ];

    // Edit form using Inertia useForm
    const { data, setData, put, processing, errors } = useForm({
        customer_name: receipt.customer_name || '',
        payment_method: receipt.payment_method || 'cash',
        amount_tendered: receipt.amount_tendered || 0,
        discount_type: receipt.discount_type || '',
        discount_value: receipt.discount_value || 0,
        notes: receipt.notes || '',
        items: (receipt.items || []).map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            item_id: item.item_id,
        })),
    });

    // Compute discount for display (view mode uses receipt data, edit mode uses form data)
    const viewDiscountAmount = receipt.discount_type === 'percentage'
        ? (receipt.subtotal || 0) * ((receipt.discount_value || 0) / 100)
        : receipt.discount_type === 'fixed'
            ? receipt.discount_value || 0
            : 0;

    // Edit mode computed values
    const editSubtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const editDiscountAmount = data.discount_type === 'percentage'
        ? editSubtotal * ((data.discount_value || 0) / 100)
        : data.discount_type === 'fixed'
            ? data.discount_value || 0
            : 0;
    const editTotal = Math.max(0, editSubtotal - editDiscountAmount);
    const editChangeDue = data.payment_method === 'cash' && data.amount_tendered > editTotal
        ? data.amount_tendered - editTotal
        : 0;

    // Use edit values when editing, receipt values when viewing
    const discountAmount = editing ? editDiscountAmount : viewDiscountAmount;

    const handleFinalize = () => {
        setFinalizing(true);
        router.post(route('receipt.finalize', { receipt: receipt.id }), {}, {
            onSuccess: () => {
                window.print();
                setFinalizing(false);
            },
            onError: () => {
                setFinalizing(false);
            },
        });
    };

    const handleSaveEdit = () => {
        put(route('receipt.update', { receipt: receipt.id }), {
            onSuccess: () => {
                setEditing(false);
            },
        });
    };

    const handleCancelEdit = () => {
        // Reset form data back to receipt values
        setData({
            customer_name: receipt.customer_name || '',
            payment_method: receipt.payment_method || 'cash',
            amount_tendered: receipt.amount_tendered || 0,
            discount_type: receipt.discount_type || '',
            discount_value: receipt.discount_value || 0,
            notes: receipt.notes || '',
            items: (receipt.items || []).map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                item_id: item.item_id,
            })),
        });
        setEditing(false);
    };

    const addItem = () => {
        setData('items', [...data.items, { id: 0, name: '', price: 0, quantity: 1, item_id: undefined }]);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const updated = [...data.items];
        updated[index] = { ...updated[index], [field]: value };
        setData('items', updated);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Receipt ${receipt.receipt_number || `#${receipt.id}`}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 print:px-1 print:py-0 max-w-6xl">
                {/* Top action bar - hidden on print */}
                <div className="flex items-center gap-2 print:hidden">
                    <Link href={route('receipt.list')}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                    </Link>

                    <div className="ml-auto flex items-center gap-2">
                        {/* Edit button - only for admin/manager when not finalized */}
                        {canEdit && !receipt.is_finalized && !editing && (
                            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                                <Pencil className="w-4 h-4 mr-1" />
                                Edit
                            </Button>
                        )}

                        {/* Cancel edit */}
                        {editing && (
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                        )}

                        {/* Finalize & Print button for non-finalized receipts */}
                        {!receipt.is_finalized && !editing && (
                            <Button
                                size="sm"
                                onClick={handleFinalize}
                                disabled={finalizing}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                {finalizing ? 'Finalizing...' : 'Finalize & Print'}
                            </Button>
                        )}

                        {/* Simple Print button for finalized receipts */}
                        {receipt.is_finalized && (
                            <Button variant="outline" size="sm" onClick={() => window.print()}>
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-3 sm:space-y-0 sm:grid print:block gap-4" style={{ gridTemplateColumns: editing ? '1fr 360px' : '1fr' }}>
                    {/* Receipt preview */}
                    <div>
                        <div className='border print:border-x-0 print:border-b-2 print:border-dashed sm:w-[120mm] print:w-[80mm] print:text-[1rem] mx-auto sm:scale-125 print:scale-100 mt-6 print:mt-3 print:border-gray-700 rounded-lg print:rounded-none text-sm'>
                            <div className='p-3 border-b text-center print:border-gray-700'>
                                <div className='flex items-center justify-center gap-2'>
                                    <span className='font-bold text-lg'>{receipt.receipt_number}</span>
                                    {/* Status badge */}
                                    {receipt.is_finalized ? (
                                        <Badge className='bg-green-100 text-green-800 border-green-300 hover:bg-green-100 print:hidden'>
                                            Finalized
                                        </Badge>
                                    ) : (
                                        <Badge className='bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 print:hidden'>
                                            Draft
                                        </Badge>
                                    )}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                    {new Date(receipt.created_at).toLocaleString()} &middot; {receipt.user?.name}
                                </div>
                            </div>
                            <table className='w-full'>
                                <thead>
                                    <tr>
                                        <th className='text-start py-2 px-2 w-2'>SN</th>
                                        <th className='text-start py-2 px-2'>Item (Qty)</th>
                                        <th className='text-end py-2 px-2'>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {(editing ? data.items : receipt.items)?.map((item, i) => (
                                    <tr key={item.id || `item-${i}`} className='print:border-gray-500 border-t'>
                                        <td className='!px-2 py-2 w-4'>{i + 1}</td>
                                        <td className='!px-2 py-2'>{item.name} (x{item.quantity})</td>
                                        <td className='!px-2 py-2 !text-end'>
                                            <span className='text-gray-500 line-through decoration-double'>N</span>
                                            {Number(item.price * item.quantity).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                <tr className='border-t print:border-gray-500'>
                                    <td className='!px-0' colSpan={3}>
                                        <table className='table2 mt-2.5 w-full'>
                                            <tbody>
                                                {discountAmount > 0 && (
                                                    <>
                                                        <tr>
                                                            <td>Subtotal</td>
                                                            <td className='end'>
                                                                <span className='text-gray-500 line-through decoration-double'>N</span>
                                                                {Number(editing ? editSubtotal : (receipt.subtotal || 0)).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Discount</td>
                                                            <td className='end text-red-600'>
                                                                -{(editing ? data.discount_type : receipt.discount_type) === 'percentage'
                                                                    ? `${editing ? data.discount_value : receipt.discount_value}%`
                                                                    : ''
                                                                } <span className='text-gray-500 line-through decoration-double'>N</span>
                                                                {Number(discountAmount).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                                <tr>
                                                    <td><b>Total</b></td>
                                                    <td className='end'>
                                                        <b>
                                                            <span className='text-gray-500 line-through decoration-double'>N</span>
                                                            {Number(editing ? editTotal : (receipt.total || 0)).toLocaleString()}
                                                        </b>
                                                    </td>
                                                </tr>
                                                {(editing ? data.payment_method : receipt.payment_method) === 'cash' &&
                                                    (editing ? data.amount_tendered : receipt.amount_tendered) &&
                                                    (editing ? data.amount_tendered > 0 : (receipt.amount_tendered || 0) > 0) && (
                                                    <>
                                                        <tr>
                                                            <td>Tendered</td>
                                                            <td className='end'>
                                                                <span className='text-gray-500 line-through decoration-double'>N</span>
                                                                {Number(editing ? data.amount_tendered : receipt.amount_tendered).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Change</td>
                                                            <td className='end font-bold'>
                                                                <span className='text-gray-500 line-through decoration-double'>N</span>
                                                                {Number(editing ? editChangeDue : (receipt.change_due || 0)).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                                <tr className='border-b-2 border-dashed print:border-gray-800'>
                                                    <td colSpan={2} className='!text-center pb-3'>
                                                        <b>{toWords.convert(editing ? editTotal : (receipt.total || 0))} Naira only</b>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} className='pb-2 pt-3'>
                                                        <div className='flex gap-2'>
                                                            <span>Payment:</span>
                                                            <b className='capitalize'>{editing ? data.payment_method : receipt.payment_method}</b>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} className='pb-4'>
                                                        <div className='flex gap-2'>
                                                            <span>Customer:</span>
                                                            <b>{editing ? data.customer_name : receipt.customer_name}</b>
                                                        </div>
                                                        {(editing ? data.notes : receipt.notes) && (
                                                            <div className='whitespace-pre-line text-xs italic mt-1'>
                                                                {editing ? data.notes : receipt.notes}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div className='flex flex-col gap-3'>
                                                            <span>Customer Sign:</span>
                                                            <span>_______________</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className='flex flex-col gap-3 ms-auto w-fit'>
                                                            <span>Cashier Sign:</span>
                                                            <span>_______________</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Edit sidebar panel - hidden on print */}
                    {editing && (
                        <div className='print:hidden space-y-4'>
                            {/* Line items editor */}
                            <div className='border rounded-2xl shadow p-3'>
                                <h3 className='mb-3 font-semibold'>Edit Items</h3>
                                <div className='space-y-2'>
                                    {data.items.map((item, index) => (
                                        <div key={index} className='flex items-end gap-2'>
                                            <div className='flex-1'>
                                                {index === 0 && <Label className='text-xs'>Name</Label>}
                                                <Input
                                                    type='text'
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    placeholder='Item name'
                                                    className='h-9'
                                                />
                                            </div>
                                            <div className='w-20'>
                                                {index === 0 && <Label className='text-xs'>Price</Label>}
                                                <Input
                                                    type='number'
                                                    value={item.price || ''}
                                                    onChange={(e) => updateItem(index, 'price', Number(e.target.value) || 0)}
                                                    placeholder='Price'
                                                    className='h-9'
                                                />
                                            </div>
                                            <div className='w-16'>
                                                {index === 0 && <Label className='text-xs'>Qty</Label>}
                                                <Input
                                                    type='number'
                                                    value={item.quantity || ''}
                                                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                                                    placeholder='Qty'
                                                    className='h-9'
                                                />
                                            </div>
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                                                onClick={() => removeItem(index)}
                                                disabled={data.items.length <= 1}
                                            >
                                                <Trash2 className='w-4 h-4' />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant='outline' size='sm' className='w-full mt-2' onClick={addItem}>
                                        <Plus className='w-4 h-4 mr-1' />
                                        Add Item
                                    </Button>
                                </div>
                            </div>

                            {/* Payment & Customer fields */}
                            <div className='border rounded-2xl shadow p-3'>
                                <h3 className='mb-3 font-semibold'>Payment & Customer</h3>
                                <div className='space-y-3'>
                                    <div>
                                        <Label>Customer Name</Label>
                                        <Input
                                            type='text'
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                            placeholder='Customer name'
                                        />
                                        {errors.customer_name && (
                                            <p className='text-red-500 text-xs mt-1'>{errors.customer_name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>Payment Method</Label>
                                        <select
                                            className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                        >
                                            <option value='cash'>Cash</option>
                                            <option value='card'>Card</option>
                                            <option value='transfer'>Transfer</option>
                                        </select>
                                        {errors.payment_method && (
                                            <p className='text-red-500 text-xs mt-1'>{errors.payment_method}</p>
                                        )}
                                    </div>
                                    {data.payment_method === 'cash' && (
                                        <div>
                                            <Label>Amount Tendered</Label>
                                            <Input
                                                type='number'
                                                value={data.amount_tendered || ''}
                                                onChange={(e) => setData('amount_tendered', Number(e.target.value) || 0)}
                                                placeholder='Amount given by customer'
                                            />
                                            {editChangeDue > 0 && (
                                                <div className='text-sm text-green-600 font-medium mt-1'>
                                                    Change: <span className='text-gray-500 line-through decoration-double text-xs'>N</span>{Number(editChangeDue).toLocaleString()}
                                                </div>
                                            )}
                                            {errors.amount_tendered && (
                                                <p className='text-red-500 text-xs mt-1'>{errors.amount_tendered}</p>
                                            )}
                                        </div>
                                    )}
                                    <div className='grid grid-cols-2 gap-2'>
                                        <div>
                                            <Label>Discount Type</Label>
                                            <select
                                                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                                value={data.discount_type}
                                                onChange={(e) => setData('discount_type', e.target.value)}
                                            >
                                                <option value=''>None</option>
                                                <option value='percentage'>Percentage (%)</option>
                                                <option value='fixed'>Fixed Amount</option>
                                            </select>
                                        </div>
                                        {data.discount_type && (
                                            <div>
                                                <Label>{data.discount_type === 'percentage' ? 'Discount %' : 'Discount Amount'}</Label>
                                                <Input
                                                    type='number'
                                                    value={data.discount_value || ''}
                                                    onChange={(e) => setData('discount_value', Number(e.target.value) || 0)}
                                                    placeholder={data.discount_type === 'percentage' ? '10' : '500'}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {errors.discount_type && (
                                        <p className='text-red-500 text-xs mt-1'>{errors.discount_type}</p>
                                    )}
                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder='Extra details'
                                        />
                                        {errors.notes && (
                                            <p className='text-red-500 text-xs mt-1'>{errors.notes}</p>
                                        )}
                                    </div>
                                    <Button
                                        className='mt-2 w-full'
                                        onClick={handleSaveEdit}
                                        disabled={processing}
                                    >
                                        <Check className='w-4 h-4 mr-1' />
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Audit log panel - hidden on print */}
                {receipt.audits && receipt.audits.length > 0 && (
                    <div className='print:hidden mt-4 sm:w-[120mm] mx-auto sm:scale-125 origin-top'>
                        <div className='border rounded-lg p-4'>
                            <h3 className='font-semibold text-sm flex items-center gap-2 mb-3'>
                                <History className='w-4 h-4' />
                                Audit Trail
                            </h3>
                            <div className='space-y-2'>
                                {receipt.audits.map((audit: ReceiptAudit) => (
                                    <div key={audit.id} className='flex items-start gap-3 text-xs border-l-2 border-gray-200 pl-3 py-1'>
                                        <div className='flex-1'>
                                            <div className='flex items-center gap-2'>
                                                <span className='font-medium'>{audit.user?.name || 'System'}</span>
                                                <span className='text-muted-foreground'>&middot;</span>
                                                <span className='text-muted-foreground'>
                                                    {new Date(audit.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className='text-muted-foreground mt-0.5'>{audit.action}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
