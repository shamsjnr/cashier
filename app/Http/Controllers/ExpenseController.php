<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('user:id,name');

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        return Inertia::render('expenses/index', [
            'expenses' => $query->latest('expense_date')->paginate(25)->withQueryString(),
            'filters' => $request->only(['date_from', 'date_to', 'category']),
            'expenseCategories' => ['general', 'rent', 'utilities', 'supplies', 'maintenance', 'salary', 'transport', 'other'],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|min:2',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'expense_date' => 'required|date',
        ]);

        $validated['user_id'] = Auth::id();

        Expense::create($validated);

        return back()->with('status', 'success');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'title' => 'required|string|min:2',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'expense_date' => 'required|date',
        ]);

        $expense->update($validated);

        return back()->with('status', 'success');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return back()->with('status', 'success');
    }
}
