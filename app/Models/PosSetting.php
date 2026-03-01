<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PosSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, $default = null): ?string
    {
        return Cache::rememberForever("pos_setting.{$key}", function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    public static function set(string $key, $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("pos_setting.{$key}");
    }
}
