<?php

namespace App\Http\Controllers;

use App\Models\Receipt;
use App\Http\Requests\StoreReceiptRequest;
use App\Http\Requests\UpdateReceiptRequest;
use App\Models\ReceiptData;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = [
            // 'receipts' => Cache::remember('receipt.list', now()->addHours(6), function() {
            //     return Receipt::whereDate('created_at', date('Y-m-d'))->with('by')->get();
                'receipts' => Receipt::whereDate('created_at', date('Y-m-d'))->with(['user:id,name', 'items'])->get()
            // })
        ];

        return Inertia::render('cashier/receipts', $data);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('cashier/partials/receipt');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreReceiptRequest $request)
    {
        $purchases = $request->input('receipt');
        $customer = $request->input('customer');
        $printed_at = $request->input('printed_at');

        $receipt = new Receipt();
        $receipt->customer_name = $customer;
        $receipt->printed_at = $printed_at;
        $receipt->user_id = Auth::id();
        $receipt->save();

        foreach ($purchases as $row) {
            if (! $row['product'] || ! $row['quantity'] || ! $row['price']) continue;

            $data = new ReceiptData();
            $data->receipt_id = $receipt->id;
            $data->name = $row['product'];
            $data->price = $row['price'];
            $data->quantity = $row['quantity'];
            $data->save();
        }

        Cache::forget('receipt.list');

        return back()->with('status', 'success');
    }

    /**
     * Display the specified resource.
     */
    public function show(Receipt $receipt)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Receipt $receipt)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateReceiptRequest $request, Receipt $receipt)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Receipt $receipt)
    {
        //
    }
}
