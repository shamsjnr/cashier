<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Receipt;
use App\Models\ReceiptAudit;
use App\Models\Customer;
use App\Models\StockMovement;
use App\Http\Requests\StoreReceiptRequest;
use App\Http\Requests\UpdateReceiptRequest;
use App\Models\ReceiptData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = Receipt::with(['user:id,name', 'items']);

        $hasFilters = $request->hasAny(['date_from', 'date_to', 'search', 'payment_method']);

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('receipt_number', 'like', "%{$search}%");
            });
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $perPage = $hasFilters ? 25 : 10;

        return Inertia::render('cashier/receipts', [
            'receipts' => $query->latest()->paginate($perPage)->withQueryString(),
            'filters' => $request->only(['date_from', 'date_to', 'search', 'payment_method']),
        ]);
    }

    public function create()
    {
        return Inertia::render('cashier/partials/receipt', [
            'catalogItems' => Item::where(function ($q) {
                $q->where('track_stock', false)->orWhere('stock_quantity', '>', 0);
            })->orderBy('name')->get(['uuid', 'name', 'price', 'stock_quantity', 'category_id']),
            'customers' => Customer::orderBy('name')->get(['id', 'name', 'phone']),
        ]);
    }

    public function store(StoreReceiptRequest $request)
    {
        $purchases = $request->input('receipt');
        $customer = $request->input('customer');

        $today = now()->format('Ymd');
        $count = Receipt::whereDate('created_at', today())->count() + 1;
        $receiptNumber = "RCP-{$today}-" . str_pad($count, 4, '0', STR_PAD_LEFT);

        $receipt = new Receipt();
        $receipt->receipt_number = $receiptNumber;
        $receipt->customer_name = $customer;
        $receipt->customer_id = $request->input('customer_id');
        $receipt->printed_at = $request->input('printed_at');
        $receipt->user_id = Auth::id();
        $receipt->payment_method = $request->input('payment_method', 'cash');
        $receipt->amount_tendered = $request->input('amount_tendered');
        $receipt->discount_type = $request->input('discount_type');
        $receipt->discount_value = $request->input('discount_value', 0);
        $receipt->notes = $request->input('notes');
        $receipt->is_finalized = false;

        $subtotal = 0;
        foreach ($purchases as $row) {
            if (!$row['product'] || !$row['quantity'] || !$row['price']) continue;
            $subtotal += $row['price'] * $row['quantity'];
        }

        $receipt->subtotal = $subtotal;

        $discount = 0;
        if ($receipt->discount_type === 'percentage') {
            $discount = $subtotal * ($receipt->discount_value / 100);
        } elseif ($receipt->discount_type === 'fixed') {
            $discount = $receipt->discount_value;
        }

        $receipt->total = $subtotal - $discount;
        $receipt->change_due = ($receipt->amount_tendered ?? 0) > $receipt->total
            ? $receipt->amount_tendered - $receipt->total
            : 0;

        $receipt->save();

        foreach ($purchases as $row) {
            if (!$row['product'] || !$row['quantity'] || !$row['price']) continue;

            ReceiptData::create([
                'receipt_id' => $receipt->id,
                'item_id' => $row['item_uuid'] ?? null,
                'name' => $row['product'],
                'price' => $row['price'],
                'quantity' => $row['quantity'],
            ]);

            if (!empty($row['item_uuid'])) {
                $item = Item::find($row['item_uuid']);
                if ($item && $item->track_stock) {
                    $item->decrement('stock_quantity', $row['quantity']);
                    StockMovement::create([
                        'item_uuid' => $item->uuid,
                        'quantity' => -$row['quantity'],
                        'type' => 'sale',
                        'reference' => (string) $receipt->id,
                        'user_id' => Auth::id(),
                    ]);
                }
            }
        }

        ReceiptAudit::create([
            'receipt_id' => $receipt->id,
            'user_id' => Auth::id(),
            'action' => 'created',
            'changes' => ['receipt_number' => $receiptNumber, 'total' => $receipt->total],
        ]);

        Cache::forget('receipt.list');

        return redirect()->route('receipt.show', $receipt)->with([
            'status' => 'success',
            'message' => 'Receipt saved. Review and print to finalize.',
        ]);
    }

    public function show(Receipt $receipt)
    {
        $receipt->load(['user:id,name', 'items', 'customer', 'audits.user:id,name']);

        return Inertia::render('cashier/receipt-detail', [
            'receipt' => $receipt,
            'canEdit' => Auth::user()->can('receipts.view_all'),
        ]);
    }

    public function update(Request $request, Receipt $receipt)
    {
        if (!Auth::user()->can('receipts.view_all')) {
            abort(403);
        }

        $validated = $request->validate([
            'customer_name' => 'required|string',
            'customer_id' => 'nullable|integer',
            'payment_method' => 'required|in:cash,card,transfer',
            'amount_tendered' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.item_id' => 'nullable|string',
        ]);

        $oldData = $receipt->only(['customer_name', 'payment_method', 'amount_tendered', 'discount_type', 'discount_value', 'subtotal', 'total', 'notes']);
        $oldItems = $receipt->items->map(fn ($i) => $i->only(['name', 'price', 'quantity']))->toArray();

        // Update receipt fields
        $receipt->customer_name = $validated['customer_name'];
        $receipt->customer_id = $validated['customer_id'];
        $receipt->payment_method = $validated['payment_method'];
        $receipt->amount_tendered = $validated['amount_tendered'];
        $receipt->discount_type = $validated['discount_type'];
        $receipt->discount_value = $validated['discount_value'] ?? 0;
        $receipt->notes = $validated['notes'];

        // Recalculate totals
        $subtotal = collect($validated['items'])->sum(fn ($i) => $i['price'] * $i['quantity']);
        $receipt->subtotal = $subtotal;

        $discount = 0;
        if ($receipt->discount_type === 'percentage') {
            $discount = $subtotal * ($receipt->discount_value / 100);
        } elseif ($receipt->discount_type === 'fixed') {
            $discount = $receipt->discount_value;
        }

        $receipt->total = $subtotal - $discount;
        $receipt->change_due = ($receipt->amount_tendered ?? 0) > $receipt->total
            ? $receipt->amount_tendered - $receipt->total
            : 0;

        $receipt->save();

        // Replace line items
        $receipt->items()->delete();
        foreach ($validated['items'] as $item) {
            ReceiptData::create([
                'receipt_id' => $receipt->id,
                'item_id' => $item['item_id'] ?? null,
                'name' => $item['name'],
                'price' => $item['price'],
                'quantity' => $item['quantity'],
            ]);
        }

        // Record audit
        $newData = $receipt->only(['customer_name', 'payment_method', 'amount_tendered', 'discount_type', 'discount_value', 'subtotal', 'total', 'notes']);
        $newItems = collect($validated['items'])->map(fn ($i) => ['name' => $i['name'], 'price' => $i['price'], 'quantity' => $i['quantity']])->toArray();

        ReceiptAudit::create([
            'receipt_id' => $receipt->id,
            'user_id' => Auth::id(),
            'action' => 'updated',
            'changes' => [
                'before' => ['fields' => $oldData, 'items' => $oldItems],
                'after' => ['fields' => $newData, 'items' => $newItems],
            ],
        ]);

        return back()->with([
            'status' => 'success',
            'message' => 'Receipt updated successfully.',
        ]);
    }

    public function finalize(Receipt $receipt)
    {
        if ($receipt->is_finalized) {
            return back()->with(['status' => 'info', 'message' => 'Receipt already finalized.']);
        }

        $receipt->update([
            'is_finalized' => true,
            'printed_at' => now(),
        ]);

        ReceiptAudit::create([
            'receipt_id' => $receipt->id,
            'user_id' => Auth::id(),
            'action' => 'finalized',
            'changes' => ['finalized_at' => now()->toDateTimeString()],
        ]);

        return back()->with([
            'status' => 'success',
            'message' => 'Receipt finalized and printed.',
        ]);
    }

    public function destroy(Receipt $receipt)
    {
        //
    }
}
