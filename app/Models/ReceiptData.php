<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptData extends Model
{
    /**
     * Get the Receipt that owns the ReceiptData
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function Receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }
}
