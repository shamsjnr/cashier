<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->string('receipt_number')->nullable()->unique()->after('id');
            $table->string('payment_method')->default('cash')->after('user_id');
            $table->decimal('amount_tendered', 12, 2)->nullable()->after('payment_method');
            $table->decimal('change_due', 12, 2)->default(0)->after('amount_tendered');
            $table->string('discount_type')->nullable()->after('change_due');
            $table->decimal('discount_value', 12, 2)->default(0)->after('discount_type');
            $table->decimal('subtotal', 12, 2)->default(0)->after('discount_value');
            $table->decimal('total', 12, 2)->default(0)->after('subtotal');
            $table->text('notes')->nullable()->after('total');
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropColumn([
                'receipt_number', 'payment_method', 'amount_tendered',
                'change_due', 'discount_type', 'discount_value',
                'subtotal', 'total', 'notes',
            ]);
        });
    }
};
