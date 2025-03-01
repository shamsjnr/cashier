<?php

use App\Http\Controllers\ItemController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware('auth')->group(function() {
    Route::prefix('items')->group(function() {
        Route::get('', [ItemController::class, 'index'])->name('item.list');
        Route::post('', [ItemController::class, 'store']);
        Route::put('{item}', [ItemController::class, 'update'])->name('item.update');
        Route::delete('{item}', [ItemController::class, 'destroy']);
    });
});

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
