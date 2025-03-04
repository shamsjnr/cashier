import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
// import { Receipt } from '@/types';
import { Head } from '@inertiajs/react';
// import { StaffModal, DeleteStaffModal } from './partials/receipt';
import Thanks from '@/components/thanks';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { ToWords } from 'to-words';

// export default function Receipts({ receipts }: {receipts: Receipt[]}) {
export default function Receipts() {

    // const [onOpen, setOnOpen] = useState(false);
    // const [editing, setEditing] = useState<Receipt | null>(null);
    // const [deleting, setDeleting] = useState<Receipt | null>(null);
    // const [onDeleteOpen, setOnDeleteOpen] = useState(false);

    const toWords = new ToWords({
        localeCode: 'en-NG',
    });

    interface item {
        product: string;
        quantity: number;
        price: number;
    }

    const [input, setInput] = useState<item>({
        product: '',
        quantity: 1,
        price: 0,
    });

    const [receipt, setReceipt] = useState<item[]>([]);
    const [customer, setCustomer] = useState<string>('');
    const [details, setDetails] = useState<string>('');
    const [canPrint, setCanPrint] = useState<boolean>(false);
    const [shouldPrint, setShouldPrint] = useState<boolean>(false);

    const populate = () => {
        if ( ! input.price || ! input.quantity || ! input.product ) return;
        setReceipt(prev => ([...prev, input]));
        setInput({
            product: '',
            quantity: 1,
            price: 0
        });
    }

    useEffect(() => {
        setCanPrint((receipt?.length > 0 && customer != ''));
        if (shouldPrint === true) {
            window.print();
            setShouldPrint(false);
        }
    }, [customer, receipt, shouldPrint]);

    const total:number = receipt?.length && receipt?.reduce((acc:number, c:item) => (acc + (c.price * c.quantity)), 0)

    return (
        <AppLayout>
            <Head title="Receipt Generator" />
            {/* <StaffModal onOpen={onOpen} setOnOpen={setOnOpen} editing={editing} />
            <DeleteStaffModal onOpen={onDeleteOpen} setOnOpen={setOnDeleteOpen} editing={deleting} /> */}

            <div className={`flex h-full flex-1 flex-col print:${ shouldPrint ? 'flex' : 'hidden'} gap-4 rounded-xl p-4 print:px-1 print:py-0 max-w-6xl`}>
                {/* <div className="flex justify-end items-center print:hidden">
                    <Button variant="default"
                        onClick={() => {
                            setOnOpen(true)
                            setEditing(null)
                        }}
                    >Add receipts</Button>
                </div> */}
                <div className="grid grid-cols-[1fr_360px] print:block">
                    <div>
                        <div className='overflow-auto border print:border-x-0 print:border-b-2 print:border-dashed w-[120mm] print:w-[80mm] print:text-[1rem] mx-auto scale-125 print:scale-100 mt-10 print:mt-3 print:border-gray-700 rounded-lg print:rounded-none text-sm'>
                            <table className='w-full'>
                                <thead>
                                    <tr className=''>
                                        <th className='text-start py-2 px-2 w-2'>SN</th>
                                        <th className='text-start py-2 px-2'>Product (Qty)</th>
                                        <th className='text-end py-2 px-2'>Price</th>
                                        {/* <th className='text-end py-2 px-3'>Qty</th> */}
                                        {/* <th className='text-start py-2 px-3 print:hidden'></th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                {
                                receipt.map((data: item, i: number) => (
                                    <tr key={`receipts-${i}`} className='print:border-gray-500 border-t'>
                                        <td className='!px-2 py-2.5 print:py-2 w-4'>{i + 1}</td>
                                        <td className='!px-2 py-2.5 print:py-2'>{ data.product } (x{data.quantity})</td>
                                        {/* <td className='!px-3 py-2.5 print:py-2 !text-end'>{ data.quantity }</td> */}
                                        <td className='!px-2 py-2.5 print:py-2 !text-end'>
                                            <span className='text-gray-500 line-through decoration-double'>N</span>
                                            { Number(data.price).toLocaleString() }
                                        </td>
                                    </tr>
                                ))
                                }
                                { ! receipt?.length &&
                                    <tr>
                                        <td className='!p-4 !text-center' colSpan={5}>No data available</td>
                                    </tr>
                                }
                                <tr className='print:border-gray-500 border-t'>
                                    <td className='!px-0' colSpan={3}>
                                        <table className="table2 mt-2.5 w-full">
                                            <tbody>
                                                <tr>
                                                    <td>Total</td>
                                                    <td className="end">
                                                        {total ?
                                                        <>
                                                            <span className='text-gray-500 line-through decoration-double'>N</span>
                                                            { Number(total).toLocaleString() }
                                                        </>
                                                        : "-"
                                                        }
                                                    </td>
                                                </tr>
                                                <tr className="border-b-2 border-dashed print:border-gray-800 text-gray-800;">
                                                    <td colSpan={2} className="!text-center pb-3"><b>{ toWords.convert(total || 0) } Naira only</b></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} className='pb-4'>
                                                        <div className="flex gap-2 pt-6">
                                                            <span>Customer Name:</span>
                                                            <b>{ customer }</b>
                                                        </div>
                                                    { details &&
                                                        <div>{ details }</div>
                                                    }
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
                            <h3 className='mb-3 font-semibold'>Purchase Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor=''>Product name</Label>
                                    <Input
                                        type='text'
                                        value={input.product}
                                        onChange={(e) => setInput(prev => (
                                            {...prev, product: e.target.value}
                                        ))}
                                        placeholder='Product name'
                                    />
                                </div>
                                <div>
                                    <Label htmlFor=''>Price</Label>
                                    <Input
                                        type='number'
                                        min={0}
                                        value={input.price}
                                        onChange={(e) => setInput(prev => ({...prev, price: Number(e.target.value)}))}
                                        placeholder='Price'
                                    />
                                </div>
                                <div>
                                    <Label htmlFor=''>Quantity</Label>
                                    <Input
                                        type='number'
                                        min={1}
                                        value={input.quantity}
                                        onChange={(e) => setInput(prev => ({...prev, quantity: Number(e.target.value)}))}
                                        placeholder='Quantity'
                                    />
                                </div>
                                <Button variant={'secondary'} className='mt-4 w-full' onClick={() => populate()}>Add</Button>
                            </div>
                        </div>
                        <div className='border rounded-2xl shadow p-3'>
                            <h3 className='mb-3 font-semibold'>Order Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <Input
                                        type='text'
                                        value={customer}
                                        onChange={(e) => setCustomer(e.target.value)}
                                        placeholder='Customer name'
                                    />
                                </div>
                                <div>
                                    <Input
                                        type='text'
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder='Extra Details'
                                    />
                                </div>
                                <Button className='mt-4 w-full' disabled={ ! canPrint } onClick={() => setShouldPrint(true)}>Print Receipt</Button>
                            </div>
                        </div>
                    </div>
                </div>
                <Thanks />
            </div>
        </AppLayout>
    );
}
