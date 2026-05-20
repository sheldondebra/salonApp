<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PortfolioGalleryItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'service_id',
        'uuid',
        'title',
        'before_image_url',
        'after_image_url',
        'caption',
        'sort_order',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PortfolioGalleryItem $item) {
            $item->uuid ??= (string) Str::uuid();
        });
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
