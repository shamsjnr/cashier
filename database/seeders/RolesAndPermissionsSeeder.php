<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'items.view', 'items.create', 'items.edit', 'items.delete',
            'categories.manage',
            'receipts.create', 'receipts.view_all',
            'staff.view', 'staff.manage',
            'reports.view', 'reports.export',
            'inventory.manage',
            'customers.manage',
            'shifts.manage', 'shifts.own',
            'expenses.manage',
            'discounts.apply',
            'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Admin - full access
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($permissions);

        // Manager - everything except staff management, item deletion, settings
        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->syncPermissions([
            'items.view', 'items.create', 'items.edit',
            'categories.manage',
            'receipts.create', 'receipts.view_all',
            'staff.view',
            'reports.view', 'reports.export',
            'inventory.manage',
            'customers.manage',
            'shifts.manage', 'shifts.own',
            'expenses.manage',
            'discounts.apply',
        ]);

        // Cashier - basic POS operations
        $cashier = Role::firstOrCreate(['name' => 'cashier']);
        $cashier->syncPermissions([
            'items.view',
            'receipts.create',
            'customers.manage',
            'shifts.own',
        ]);

        // Migrate existing users
        User::where('is_admin', 1)->each(function ($user) {
            if (!$user->hasAnyRole(['admin', 'manager', 'cashier'])) {
                $user->assignRole('admin');
            }
        });

        User::where('is_admin', '!=', 1)->orWhereNull('is_admin')->each(function ($user) {
            if (!$user->hasAnyRole(['admin', 'manager', 'cashier'])) {
                $user->assignRole('cashier');
            }
        });
    }
}
