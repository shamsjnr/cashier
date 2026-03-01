<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class StaffController extends Controller
{
    public function index()
    {
        $staff = User::role(['manager', 'cashier'])
            ->with('roles:id,name')
            ->orderBy('name')
            ->paginate(25);

        return Inertia::render('admin/staff', [
            'staff' => $staff,
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreStaffRequest $request)
    {
        $count = str_pad((User::role(['manager', 'cashier'])->count() + 1), 3, '0', STR_PAD_LEFT);
        $staffId = "STF{$count}";

        $staff = new User;
        $staff->name = $request->name;
        $staff->email = $request->email;
        $staff->username = $staffId;
        $staff->phone = $request->phone;
        $staff->password = Hash::make($request->password);
        $staff->save();

        $staff->assignRole($request->input('role', 'cashier'));

        return back()->with([
            'status' => 'success',
            'message' => 'Staff created successfully',
        ]);
    }

    public function update(UpdateStaffRequest $request, User $staff)
    {
        $staff->name = $request->name;
        $staff->email = $request->email;
        $staff->phone = $request->phone;
        $staff->save();

        if ($request->has('role')) {
            $staff->syncRoles([$request->input('role')]);
        }

        return back()->with([
            'status' => 'success',
            'message' => 'Staff details updated',
        ]);
    }

    public function destroy(User $staff)
    {
        $staff->delete();
        return back()->with([
            'status' => 'success',
            'message' => 'Staff removed',
        ]);
    }
}
