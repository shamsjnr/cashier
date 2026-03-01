<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    protected $fillable = ['item_uuid', 'quantity', 'type', 'reference', 'user_id', 'notes'];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_uuid', 'uuid');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
