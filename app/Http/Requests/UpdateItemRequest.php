<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('items.edit');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|min:2',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'category_id' => 'nullable|exists:categories,id',
            'track_stock' => 'boolean',
            'stock_quantity' => 'nullable|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
        ];
    }
}
