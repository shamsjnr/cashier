<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::withCount('receipts');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return Inertia::render('customers/index', [
            'customers' => $query->orderBy('name')->paginate(25)->withQueryString(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2',
            'phone' => 'nullable|string|max:15',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        Customer::create($validated);

        return back()->with('status', 'success');
    }

    public function show(Customer $customer)
    {
        $customer->loadCount('receipts');
        $receipts = $customer->receipts()
            ->with(['user:id,name', 'items'])
            ->latest()
            ->paginate(15);

        return Inertia::render('customers/show', [
            'customer' => $customer,
            'receipts' => $receipts,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2',
            'phone' => 'nullable|string|max:15',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $customer->update($validated);

        return back()->with('status', 'success');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return back()->with('status', 'success');
    }

    public function search(Request $request)
    {
        $search = $request->input('q', '');
        $customers = Customer::where('name', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'name', 'phone']);

        return response()->json($customers);
    }
}
