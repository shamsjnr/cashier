<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StaffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = [
            'staff' => Cache::rememberForever('users.list', function() {
                return User::whereNot('is_admin', 1)->get();
            })
        ];

        return Inertia::render('admin/staff', $data);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStaffRequest $request)
    {
        $count = str_pad((User::whereNot('is_admin', 1)->count() + 1), 3, '0', STR_PAD_LEFT);
        $staffId = "STF{$count}";

        $staff = new User;
        $staff->name = $request->name;
        $staff->email = $request->email;
        $staff->username = $staffId;
        $staff->phone = $request->phone;
        $staff->password = Hash::make($request->password);
        $staff->save();

        Cache::forget('users.list');
        return back()->with([
            'status' => 'success',
            'message' => 'Staff created successfully'
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Staff $staff)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Staff $staff)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStaffRequest $request, User $staff)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $staff)
    {
        $staff->delete();
        Cache::forget('users.list');
        return back()->with([
            'status' => 'success',
            'message' => 'Staff removed'
        ]);
    }
}
