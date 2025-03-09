<?php

use App\Http\Controllers\Dashboard;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ReceiptController;
use Illuminate\Support\Facades\Route;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');

Route::middleware(['auth'])->group(function() {
    Route::get('dashboard', [Dashboard::class, 'index'])->name('dashboard');
    Route::prefix('items')->group(function() {
        Route::get('', [ItemController::class, 'index'])->name('item.list');
        Route::post('', [ItemController::class, 'store']);
        Route::put('{item}', [ItemController::class, 'update'])->name('item.update');
        Route::delete('{item}', [ItemController::class, 'destroy']);
    });
    Route::prefix('receipt')->group(function() {
        Route::get('', [ReceiptController::class, 'index'])->name('receipt.list');
        Route::post('', [ReceiptController::class, 'store']);
        Route::get('list', [ReceiptController::class, 'create'])->name('receipt.generate');
        Route::put('{item}', [ReceiptController::class, 'update'])->name('item.update');
        Route::delete('{item}', [ReceiptController::class, 'destroy']);
    });
});

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
