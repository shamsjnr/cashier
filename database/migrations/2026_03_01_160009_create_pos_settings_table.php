<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('pos_settings')->insert([
            ['key' => 'shifts_enabled', 'value' => 'false', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'business_name', 'value' => config('app.name'), 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'currency_symbol', 'value' => '₦', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_settings');
    }
};
