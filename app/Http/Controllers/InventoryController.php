<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with('category:id,name,color');

        if ($request->has('low_stock') && $request->low_stock) {
            $query->where('track_stock', true)
                  ->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        return Inertia::render('admin/inventory', [
            'items' => $query->orderBy('name')->paginate(25)->withQueryString(),
            'filters' => $request->only(['low_stock', 'search']),
        ]);
    }

    public function adjust(Request $request, Item $item)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer',
            'type' => 'required|in:purchase,adjustment,return',
            'notes' => 'nullable|string',
        ]);

        $item->increment('stock_quantity', $validated['quantity']);

        StockMovement::create([
            'item_uuid' => $item->uuid,
            'quantity' => $validated['quantity'],
            'type' => $validated['type'],
            'reference' => null,
            'user_id' => Auth::id(),
            'notes' => $validated['notes'],
        ]);

        return back()->with('status', 'success');
    }

    public function movements(Item $item)
    {
        $movements = StockMovement::where('item_uuid', $item->uuid)
            ->with('user:id,name')
            ->latest()
            ->paginate(25);

        return Inertia::render('admin/stock-movements', [
            'item' => $item,
            'movements' => $movements,
        ]);
    }
}
