<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class Setup extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@cashier.ng',
            'username' => 'admin',
            'phone' => '00000000000',
            'is_admin' => 1,
            'password' => Hash::make('admin')
        ]);
    }
}
