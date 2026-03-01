<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Receipt extends Model
{
    protected $fillable = [
        'receipt_number', 'customer_name', 'customer_id', 'printed_at',
        'user_id', 'shift_id', 'payment_method', 'amount_tendered',
        'change_due', 'discount_type', 'discount_value', 'subtotal',
        'total', 'notes', 'is_finalized',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_tendered' => 'decimal:2',
            'change_due' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'is_finalized' => 'boolean',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReceiptData::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function audits(): HasMany
    {
        return $this->hasMany(ReceiptAudit::class);
    }
}
