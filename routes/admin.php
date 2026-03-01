<?php

use App\Http\Controllers\Admin\StaffController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::prefix('/staff')->middleware('permission:staff.view')->group(function () {
        Route::get('', [StaffController::class, 'index'])->name('staff.list');
        Route::post('', [StaffController::class, 'store'])->middleware('permission:staff.manage');
        Route::put('{staff}', [StaffController::class, 'update'])->middleware('permission:staff.manage')->name('staff.update');
        Route::delete('{staff}', [StaffController::class, 'destroy'])->middleware('permission:staff.manage');
    });
});
