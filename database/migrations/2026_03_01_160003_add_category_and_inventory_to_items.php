<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('uuid')->constrained()->nullOnDelete();
            $table->decimal('cost_price', 12, 2)->default(0)->after('price');
            $table->integer('stock_quantity')->default(0)->after('cost_price');
            $table->integer('low_stock_threshold')->default(5)->after('stock_quantity');
            $table->boolean('track_stock')->default(true)->after('low_stock_threshold');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn(['category_id', 'cost_price', 'stock_quantity', 'low_stock_threshold', 'track_stock']);
        });
    }
};
