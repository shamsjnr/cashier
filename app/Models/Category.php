<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'color', 'sort_order'];

    protected static function booted(): void
    {
        static::creating(function (Category $category) {
            if (!$category->slug) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }
}
