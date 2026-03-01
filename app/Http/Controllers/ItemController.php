<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Category;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ItemController extends Controller
{
    public function index()
    {
        $query = Item::with('category:id,name,color');

        if (request()->filled('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (request('low_stock') === '1') {
            $query->where('track_stock', true)
                  ->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        $data = [
            'items' => $query->orderBy('name')->paginate(25)->withQueryString(),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => request()->only(['search', 'low_stock']),
        ];

        return Inertia::render('admin/items', $data);
    }

    public function store(StoreItemRequest $request)
    {
        $item = new Item;
        $item->uuid = Str::uuid();
        $item->name = $request->input('name');
        $item->price = $request->input('price');
        $item->description = $request->input('description');
        $item->cost_price = $request->input('cost_price', 0);
        $item->stock_quantity = $request->input('stock_quantity', 0);
        $item->low_stock_threshold = $request->input('low_stock_threshold', 5);
        $item->track_stock = $request->input('track_stock', true);
        $item->category_id = $request->input('category_id');
        $item->save();

        return back()->with('status', 'success');
    }

    public function update(UpdateItemRequest $request, Item $item)
    {
        $item->name = $request->input('name');
        $item->price = $request->input('price');
        $item->description = $request->input('description');
        $item->cost_price = $request->input('cost_price', $item->cost_price);
        $item->category_id = $request->input('category_id');
        $item->low_stock_threshold = $request->input('low_stock_threshold', $item->low_stock_threshold);
        $item->track_stock = $request->input('track_stock', $item->track_stock);
        $item->save();

        return back()->with('status', 'success');
    }

    public function destroy(Item $item)
    {
        $item->delete();
        return back()->with('status', 'success');
    }
}
