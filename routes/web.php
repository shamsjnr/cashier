<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\Dashboard;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LicenseController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\UpdateController;
use App\Models\PosSetting;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// License activation (no auth required)
Route::prefix('license')->group(function () {
    Route::get('activate', [LicenseController::class, 'showActivation'])->name('license.activate');
    Route::post('activate', [LicenseController::class, 'activate'])->name('license.store');
});

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [Dashboard::class, 'index'])->name('dashboard');

    // Items & Inventory (combined)
    Route::prefix('items')->group(function () {
        Route::get('', [ItemController::class, 'index'])->name('item.list');
        Route::post('', [ItemController::class, 'store'])->middleware('permission:items.create');
        Route::put('{item}', [ItemController::class, 'update'])->middleware('permission:items.edit')->name('item.update');
        Route::delete('{item}', [ItemController::class, 'destroy'])->middleware('permission:items.delete');
        // Inventory actions (nested under items)
        Route::post('{item}/adjust', [InventoryController::class, 'adjust'])->middleware('permission:inventory.manage')->name('inventory.adjust');
        Route::get('{item}/movements', [InventoryController::class, 'movements'])->middleware('permission:inventory.manage')->name('inventory.movements');
    });

    // Keep old inventory route as redirect for backwards compat
    Route::get('inventory', fn () => redirect()->route('item.list'))->name('inventory.list');

    // Categories
    Route::prefix('categories')->middleware('permission:categories.manage')->group(function () {
        Route::get('', [CategoryController::class, 'index'])->name('category.list');
        Route::post('', [CategoryController::class, 'store']);
        Route::put('{category}', [CategoryController::class, 'update'])->name('category.update');
        Route::delete('{category}', [CategoryController::class, 'destroy']);
    });

    // Receipts
    Route::prefix('receipt')->group(function () {
        Route::get('', [ReceiptController::class, 'index'])->name('receipt.list');
        Route::post('', [ReceiptController::class, 'store']);
        Route::get('create', [ReceiptController::class, 'create'])->name('receipt.generate');
        Route::get('{receipt}', [ReceiptController::class, 'show'])->name('receipt.show');
        Route::put('{receipt}', [ReceiptController::class, 'update'])->middleware('permission:receipts.view_all')->name('receipt.update');
        Route::post('{receipt}/finalize', [ReceiptController::class, 'finalize'])->name('receipt.finalize');
    });

    // Customers
    Route::prefix('customers')->middleware('permission:customers.manage')->group(function () {
        Route::get('', [CustomerController::class, 'index'])->name('customer.list');
        Route::post('', [CustomerController::class, 'store']);
        Route::get('search', [CustomerController::class, 'search'])->name('customer.search');
        Route::get('{customer}', [CustomerController::class, 'show'])->name('customer.show');
        Route::put('{customer}', [CustomerController::class, 'update'])->name('customer.update');
        Route::delete('{customer}', [CustomerController::class, 'destroy']);
    });

    // Shifts
    Route::prefix('shifts')->group(function () {
        Route::get('', [ShiftController::class, 'index'])->name('shift.list');
        Route::get('current', [ShiftController::class, 'current'])->name('shift.current');
        Route::post('open', [ShiftController::class, 'open'])->name('shift.open');
        Route::post('close', [ShiftController::class, 'close'])->name('shift.close');
        Route::get('{shift}', [ShiftController::class, 'show'])->name('shift.show');
    });

    // Expenses
    Route::prefix('expenses')->middleware('permission:expenses.manage')->group(function () {
        Route::get('', [ExpenseController::class, 'index'])->name('expense.list');
        Route::post('', [ExpenseController::class, 'store']);
        Route::put('{expense}', [ExpenseController::class, 'update'])->name('expense.update');
        Route::delete('{expense}', [ExpenseController::class, 'destroy']);
    });

    // Reports
    Route::prefix('reports')->middleware('permission:reports.view')->group(function () {
        Route::get('', [ReportController::class, 'index'])->name('reports.index');
        Route::get('sales-summary', [ReportController::class, 'salesSummary'])->name('reports.sales');
        Route::get('sales-by-item', [ReportController::class, 'salesByItem'])->name('reports.by-item');
        Route::get('sales-by-staff', [ReportController::class, 'salesByStaff'])->name('reports.by-staff');
        Route::get('profit', [ReportController::class, 'profitReport'])->name('reports.profit');
        Route::get('inventory', [ReportController::class, 'inventoryReport'])->name('reports.inventory');
        Route::get('expenses', [ReportController::class, 'expenseReport'])->name('reports.expenses');

        Route::middleware('permission:reports.export')->group(function () {
            Route::get('export/csv/{report}', [ReportController::class, 'exportCsv'])->name('reports.export.csv');
            Route::get('export/pdf/{report}', [ReportController::class, 'exportPdf'])->name('reports.export.pdf');
        });
    });

    // POS Settings (shifts toggle, etc.)
    Route::prefix('pos-settings')->middleware('permission:settings.manage')->group(function () {
        Route::get('', function () {
            return Inertia::render('settings/pos', [
                'settings' => [
                    'shifts_enabled' => PosSetting::get('shifts_enabled', 'false') === 'true',
                    'business_name' => PosSetting::get('business_name', ''),
                    'currency_symbol' => PosSetting::get('currency_symbol', '₦'),
                ],
            ]);
        })->name('pos-settings');
        Route::put('', function (\Illuminate\Http\Request $request) {
            if ($request->has('shifts_enabled')) {
                PosSetting::set('shifts_enabled', $request->boolean('shifts_enabled') ? 'true' : 'false');
            }
            if ($request->filled('business_name')) {
                PosSetting::set('business_name', $request->input('business_name'));
            }
            if ($request->filled('currency_symbol')) {
                PosSetting::set('currency_symbol', $request->input('currency_symbol'));
            }
            return back()->with(['status' => 'success', 'message' => 'Settings updated.']);
        });
    });

    // System Updates (admin only)
    Route::prefix('system-update')->middleware('permission:settings.manage')->group(function () {
        Route::get('', [UpdateController::class, 'index'])->name('system-update');
        Route::post('check', [UpdateController::class, 'check'])->name('system-update.check');
        Route::post('run', [UpdateController::class, 'run'])->name('system-update.run');
        Route::get('progress', [UpdateController::class, 'progress'])->name('system-update.progress');
    });

    // License deactivation (admin only)
    Route::post('license/deactivate', [LicenseController::class, 'deactivate'])
        ->middleware('permission:settings.manage')
        ->name('license.deactivate');
});

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
