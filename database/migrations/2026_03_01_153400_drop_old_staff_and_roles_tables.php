<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('staff');
        Schema::dropIfExists('roles');
        // Drop any leftover Spatie tables from previous installs
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('permissions');
    }

    public function down(): void
    {
        Schema::create('staff', function ($table) {
            $table->id();
            $table->timestamps();
        });
        Schema::create('roles', function ($table) {
            $table->id();
            $table->timestamps();
        });
    }
};
