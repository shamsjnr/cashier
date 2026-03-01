<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptAudit extends Model
{
    protected $fillable = ['receipt_id', 'user_id', 'action', 'changes'];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
        ];
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
