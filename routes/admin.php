<?php

use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function() {
    Route::prefix('/staff')->group(function() {
        Route::get('', [StaffController::class, 'index'])->name('staff.list');
        Route::post('', [StaffController::class, 'store']);
        Route::put('{staff}', [StaffController::class, 'update'])->name('staff.update');
        Route::delete('{staff}', [StaffController::class, 'destroy']);
    });
    Route::prefix('/roles')->group(function() {
        Route::get('', [RoleController::class, 'index'])->name('role.list');
        Route::post('', [RoleController::class, 'store']);
        Route::put('{role}', [RoleController::class, 'update'])->name('role.update');
        Route::delete('{role}', [RoleController::class, 'destroy']);
    });
});
