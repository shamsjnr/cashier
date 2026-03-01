<?php

namespace App\Http\Controllers;

use App\Models\PosSetting;
use App\Models\Receipt;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::with('user:id,name')->withCount('receipts');

        if (!$request->user()->hasRole('admin') && !$request->user()->hasRole('manager')) {
            $query->where('user_id', Auth::id());
        }

        return Inertia::render('shifts/index', [
            'shifts' => $query->latest('opened_at')->paginate(25),
            'shiftsEnabled' => PosSetting::get('shifts_enabled', 'false') === 'true',
        ]);
    }

    public function current()
    {
        $shift = Shift::where('user_id', Auth::id())
            ->whereNull('closed_at')
            ->latest('opened_at')
            ->first();

        return response()->json(['shift' => $shift]);
    }

    public function open(Request $request)
    {
        $validated = $request->validate([
            'opening_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Check if user already has an open shift
        $existing = Shift::where('user_id', Auth::id())->whereNull('closed_at')->first();
        if ($existing) {
            return back()->withErrors(['shift' => 'You already have an open shift. Close it first.']);
        }

        Shift::create([
            'user_id' => Auth::id(),
            'opening_balance' => $validated['opening_balance'],
            'notes' => $validated['notes'],
            'opened_at' => now(),
        ]);

        return back()->with('status', 'success');
    }

    public function close(Request $request)
    {
        $validated = $request->validate([
            'closing_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $shift = Shift::where('user_id', Auth::id())
            ->whereNull('closed_at')
            ->latest('opened_at')
            ->firstOrFail();

        // Calculate expected balance from cash receipts during this shift
        $cashSales = Receipt::where('shift_id', $shift->id)
            ->where('payment_method', 'cash')
            ->sum('total');

        $expected = $shift->opening_balance + $cashSales;

        $shift->update([
            'closing_balance' => $validated['closing_balance'],
            'expected_balance' => $expected,
            'difference' => $validated['closing_balance'] - $expected,
            'notes' => $validated['notes'] ?? $shift->notes,
            'closed_at' => now(),
        ]);

        return back()->with('status', 'success');
    }

    public function show(Shift $shift)
    {
        $shift->load('user:id,name');
        $receipts = $shift->receipts()->with(['user:id,name', 'items'])->latest()->paginate(15);

        return Inertia::render('shifts/show', [
            'shift' => $shift,
            'receipts' => $receipts,
        ]);
    }
}
