import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { ToWords } from 'to-words';
import { Textarea } from '@/components/ui/textarea';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Receipts', href: route('receipt.list') },
    { title: 'Generate Receipt', href: route('receipt.generate') },
];

interface CatalogItem {
    uuid: string;
    name: string;
    price: number;
    stock_quantity?: number;
    category_id?: number;
}

interface ReceiptItem {
    product: string;
    quantity: number;
    price: number;
    item_uuid?: string;
    [key: string]: string | number | undefined;
}

interface ReceiptPageProps {
    catalogItems: CatalogItem[];
    customers: { id: number; name: string; phone?: string }[];
}

export default function Receipts({ catalogItems, customers }: ReceiptPageProps) {

    const toWords = new ToWords({ localeCode: 'en-NG' });

    const [input, setInput] = useState<ReceiptItem>({
        product: '',
        quantity: 1,
        price: 0,
    });

    const [receipt, setReceipt] = useState<ReceiptItem[]>([]);
    const [editing, setEditing] = useState<ReceiptItem | null>(null);
    const [customer, setCustomer] = useState<string>('');
    const [customerId, setCustomerId] = useState<number | undefined>();
    const [details, setDetails] = useState<string>('');
    const [canSave, setCanSave] = useState<boolean>(false);

    // Payment & discount
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [amountTendered, setAmountTendered] = useState<number>(0);
    const [discountType, setDiscountType] = useState<string>('');
    const [discountValue, setDiscountValue] = useState<number>(0);

    // Catalog search
    const [catalogSearch, setCatalogSearch] = useState('');
    const [showCatalog, setShowCatalog] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomers, setShowCustomers] = useState(false);

    const filteredCatalog = catalogItems?.filter(item =>
        item.name.toLowerCase().includes(catalogSearch.toLowerCase())
    ).slice(0, 8) || [];

    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.phone && c.phone.includes(customerSearch))
    ).slice(0, 5) || [];

    const selectCatalogItem = (item: CatalogItem) => {
        setInput({
            product: item.name,
            quantity: 1,
            price: item.price,
            item_uuid: item.uuid,
        });
        setCatalogSearch('');
        setShowCatalog(false);
    };

    const selectCustomer = (c: { id: number; name: string; phone?: string }) => {
        setCustomer(c.name);
        setCustomerId(c.id);
        setCustomerSearch('');
        setShowCustomers(false);
    };

    const populate = () => {
        if (!input.price || !input.quantity || !input.product) return;
        if (editing) {
            const data = receipt.find(item => item === editing);
            if (data) {
                data.product = input.product;
                data.price = input.price;
                data.quantity = input.quantity;
                data.item_uuid = input.item_uuid;
            }
            setEditing(null);
        } else {
            setReceipt(prev => ([...prev, input]));
        }
        setInput({ product: '', quantity: 1, price: 0 });
    };

    const subtotal: number = receipt?.length ? receipt.reduce((acc, c) => acc + (c.price * c.quantity), 0) : 0;

    const discountAmount = discountType === 'percentage'
        ? subtotal * (discountValue / 100)
        : discountType === 'fixed'
            ? discountValue
            : 0;

    const total = Math.max(0, subtotal - discountAmount);
    const changeDue = paymentMethod === 'cash' && amountTendered > total ? amountTendered - total : 0;

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setCanSave(receipt.length > 0 && customer !== '');
    }, [customer, receipt]);

    const handleSave = () => {
        setSaving(true);
        router.post(route('receipt.list'), {
            receipt: receipt as unknown as Record<string, string | number | undefined>[],
            customer: customer,
            customer_id: customerId,
            printed_at: new Date().toJSON(),
            payment_method: paymentMethod,
            amount_tendered: amountTendered,
            discount_type: discountType,
            discount_value: discountValue,
            notes: details,
        }, {
            onFinish: () => setSaving(false),
        });
    };

    const handleUpdate = (type: string, data: ReceiptItem) => {
        if (type === 'edit') {
            setEditing(data);
            setInput({
                product: data.product,
                quantity: data.quantity,
                price: data.price,
                item_uuid: data.item_uuid,
            });
        } else {
            setReceipt(prev => prev.filter(item => item !== data));
            setEditing(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Receipt Generator" />
            <div className="flex h-full flex-1 flex-col print:hidden gap-4 rounded-xl p-4 print:px-1 print:py-0 max-w-6xl">
                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-[1fr_360px] print:block gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => history.back()} className='ms-24 mb-4 py-0 ps-0 hover:ps-3 transition-all print:hidden'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
                                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="48" d="M328 112L184 256l144 144" />
                            </svg> Go back
                        </Button>
                        <div className='overflow-auto border print:border-x-0 print:border-b-2 print:border-dashed sm:w-[120mm] print:w-[80mm] print:text-[1rem] mx-auto sm:scale-125 print:scale-100 mt-10 print:mt-3 print:border-gray-700 rounded-lg print:rounded-none text-sm'>
                            <table className='w-full'>
                                <thead>
                                    <tr>
                                        <th className='text-start py-2 px-2 w-2'>SN</th>
                                        <th className='text-start py-2 px-2'>Product (Qty)</th>
                                        <th className='text-end py-2 px-2'>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {receipt.map((data: ReceiptItem, i: number) => (
                                    <tr key={`receipts-${i}`} className={'print:border-gray-500 border-t group/tr ' +
                                        (editing === data && ' bg-gray-100/75 text-gray-400 dark:bg-gray-700')
                                    }>
                                        <td className='!px-2 py-2.5 print:py-2 w-4'>{i + 1}</td>
                                        <td className='!px-2 py-2.5 print:py-2'>{data.product} (x{data.quantity})</td>
                                        <td className='!px-2 py-2.5 print:py-2 !text-end relative'>
                                            <div className='text-nowrap group-hover/tr:opacity-0'>
                                                <span className='text-gray-500 line-through decoration-double'>N</span>
                                                {Number(data.price * data.quantity).toLocaleString()}
                                            </div>
                                            <div className='absolute opacity-0 -z-10 group-hover/tr:z-10 group-hover/tr:opacity-100 top-1/2 -translate-y-1/2 origin-right right-2 flex items-center scale-75 gap-2 transition-all'>
                                                <Button variant={'outline'} size={'sm'} onClick={() => handleUpdate('edit', data)}>Edit</Button>
                                                <Button variant={'destructive'} size={'sm'} onClick={() => handleUpdate('delete', data)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!receipt.length && (
                                    <tr>
                                        <td className='!p-4 !text-center' colSpan={3}>No items added</td>
                                    </tr>
                                )}
                                <tr className='print:border-gray-500 border-t'>
                                    <td className='!px-0' colSpan={3}>
                                        <table className="table2 mt-2.5 w-full">
                                            <tbody>
                                                {discountAmount > 0 && (
                                                    <>
                                                        <tr>
                                                            <td>Subtotal</td>
                                                            <td className="end">
                                                                <span className='text-gray-500 line-through decoration-double'>N</span>
                                                                {Number(subtotal).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Discount</td>
                                                            <td className="end text-red-600">
                                                                -{discountType === 'percentage' ? `${discountValue}%` : ''} <span className='text-gray-500 line-through decoration-double'>N</span>
                                                                {Number(discountAmount).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                                <tr>
                                                    <td>Total</td>
                                                    <td className="end">
                                                        {total ?
                                                        <>
                                                            <span className='text-gray-500 line-through decoration-double'>N</span>
                                                            {Number(total).toLocaleString()}
                                                        </>
                                                        : "-"
                                                        }
                                                    </td>
                                                </tr>
                                                {paymentMethod === 'cash' && amountTendered > 0 && (
                                                    <>
                                                        <tr>
                                                            <td>Tendered</td>
                                                            <td className="end">
                                                                <span className='text-gray-500 line-through decoration-double'>N</span>
                                                                {Number(amountTendered).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Change</td>
                                                            <td className="end font-bold">
                                                                <span className='text-gray-500 line-through decoration-double'>N</span>
                                                                {Number(changeDue).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                                <tr className="border-b-2 border-dashed print:border-gray-800 text-gray-800">
                                                    <td colSpan={2} className="!text-center pb-3"><b>{toWords.convert(total || 0)} Naira only</b></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} className="pb-2 pt-3">
                                                        <div className="flex gap-2">
                                                            <span>Payment:</span>
                                                            <b className="capitalize">{paymentMethod}</b>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} className='pb-4'>
                                                        <div className="flex gap-2">
                                                            <span>Customer Name:</span>
                                                            <b>{customer}</b>
                                                        </div>
                                                        {details && (
                                                            <div className='whitespace-pre-line text-xs italic'>{details}</div>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div className="flex flex-col gap-3">
                                                            <span>Customer Sign:</span>
                                                            <span>_______________</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col gap-3 ms-auto w-fit">
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
                    <div className='print:hidden space-y-4'>
                        <div className='border rounded-2xl shadow p-3'>
                            <h3 className='mb-3 font-semibold'>Add Item</h3>
                            {/* Catalog search */}
                            <div className='relative mb-3'>
                                <Input
                                    type='text'
                                    placeholder='Search catalog...'
                                    value={catalogSearch}
                                    onChange={(e) => { setCatalogSearch(e.target.value); setShowCatalog(true); }}
                                    onFocus={() => setShowCatalog(true)}
                                    onBlur={() => setTimeout(() => setShowCatalog(false), 200)}
                                />
                                {showCatalog && catalogSearch && filteredCatalog.length > 0 && (
                                    <div className='absolute z-20 top-full left-0 right-0 bg-white dark:bg-gray-900 border rounded-lg shadow-lg max-h-48 overflow-auto'>
                                        {filteredCatalog.map((item) => (
                                            <button
                                                key={item.uuid}
                                                type='button'
                                                className='w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm flex justify-between'
                                                onMouseDown={() => selectCatalogItem(item)}
                                            >
                                                <span>{item.name}</span>
                                                <span className='text-muted-foreground'>
                                                    <span className='text-gray-400 line-through decoration-double text-xs'>N</span>
                                                    {Number(item.price).toLocaleString()}
                                                    {item.stock_quantity !== undefined && item.stock_quantity !== null && (
                                                        <span className='ml-2 text-xs'>({item.stock_quantity} in stock)</span>
                                                    )}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className='text-xs text-muted-foreground text-center mb-3'>or enter manually</div>
                            <div className="space-y-3">
                                <div>
                                    <Label>Product name</Label>
                                    <Input
                                        type='text'
                                        value={input.product}
                                        onChange={(e) => setInput(prev => ({...prev, product: e.target.value, item_uuid: undefined}))}
                                        placeholder='Product name'
                                    />
                                </div>
                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <Label>Price</Label>
                                        <Input
                                            type='text'
                                            value={input.price}
                                            onChange={(e) => setInput(prev => ({...prev, price: Number(e.target.value) || 0}))}
                                            placeholder='Price'
                                        />
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type='text'
                                            value={input.quantity}
                                            onChange={(e) => setInput(prev => ({...prev, quantity: Number(e.target.value) || 0}))}
                                            placeholder='Quantity'
                                        />
                                    </div>
                                </div>
                                <Button variant={'secondary'} className='mt-2 w-full' onClick={() => populate()}>
                                    {editing ? 'Update' : 'Add'}
                                </Button>
                            </div>
                        </div>
                        <div className='border rounded-2xl shadow p-3'>
                            <h3 className='mb-3 font-semibold'>Payment & Customer</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label>Payment Method</Label>
                                    <select
                                        className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value='cash'>Cash</option>
                                        <option value='card'>Card</option>
                                        <option value='transfer'>Transfer</option>
                                    </select>
                                </div>
                                {paymentMethod === 'cash' && (
                                    <div>
                                        <Label>Amount Tendered</Label>
                                        <Input
                                            type='number'
                                            value={amountTendered || ''}
                                            onChange={(e) => setAmountTendered(Number(e.target.value) || 0)}
                                            placeholder='Amount given by customer'
                                        />
                                        {changeDue > 0 && (
                                            <div className='text-sm text-green-600 font-medium mt-1'>
                                                Change: <span className='text-gray-500 line-through decoration-double text-xs'>N</span>{Number(changeDue).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <Label>Discount Type</Label>
                                        <select
                                            className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value)}
                                        >
                                            <option value=''>None</option>
                                            <option value='percentage'>Percentage (%)</option>
                                            <option value='fixed'>Fixed Amount</option>
                                        </select>
                                    </div>
                                    {discountType && (
                                        <div>
                                            <Label>{discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}</Label>
                                            <Input
                                                type='number'
                                                value={discountValue || ''}
                                                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                                                placeholder={discountType === 'percentage' ? '10' : '500'}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className='relative'>
                                    <Label>Customer</Label>
                                    <Input
                                        type='text'
                                        value={customer || customerSearch}
                                        onChange={(e) => {
                                            setCustomer(e.target.value);
                                            setCustomerSearch(e.target.value);
                                            setCustomerId(undefined);
                                            setShowCustomers(true);
                                        }}
                                        onFocus={() => setShowCustomers(true)}
                                        onBlur={() => setTimeout(() => setShowCustomers(false), 200)}
                                        placeholder='Customer name'
                                    />
                                    {showCustomers && customerSearch && filteredCustomers.length > 0 && (
                                        <div className='absolute z-20 top-full left-0 right-0 bg-white dark:bg-gray-900 border rounded-lg shadow-lg max-h-36 overflow-auto'>
                                            {filteredCustomers.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type='button'
                                                    className='w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm'
                                                    onMouseDown={() => selectCustomer(c)}
                                                >
                                                    {c.name} {c.phone && <span className='text-muted-foreground'>({c.phone})</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder='Extra details'
                                    />
                                </div>
                                <Button className='mt-2 w-full' disabled={!canSave || saving} onClick={handleSave}>
                                    {saving ? 'Saving...' : 'Save Receipt'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
