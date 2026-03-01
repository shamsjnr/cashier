<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('item_uuid');
            $table->foreign('item_uuid')->references('uuid')->on('items')->cascadeOnDelete();
            $table->integer('quantity');
            $table->string('type'); // purchase, sale, adjustment, return
            $table->string('reference')->nullable();
            $table->foreignId('user_id')->constrained();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
