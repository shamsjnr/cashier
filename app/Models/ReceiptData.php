<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptData extends Model
{
    protected $fillable = ['receipt_id', 'item_id', 'name', 'price', 'quantity'];

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'uuid');
    }
}
