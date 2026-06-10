<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Service extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'service_category_id',
        'uuid',
        'name',
        'description',
        'duration_minutes',
        'price_cents',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Service $service) {
            $service->uuid ??= (string) Str::uuid();
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function staffServices(): HasMany
    {
        return $this->hasMany(StaffService::class);
    }

    public function activeStaffServices(): HasMany
    {
        return $this->staffServices()->whereBool('is_active', true);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
