<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->decimal('opening_balance', 12, 2)->default(0);
            $table->decimal('closing_balance', 12, 2)->nullable();
            $table->decimal('expected_balance', 12, 2)->nullable();
            $table->decimal('difference', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->foreignId('shift_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn('shift_id');
        });
        Schema::dropIfExists('shifts');
    }
};
