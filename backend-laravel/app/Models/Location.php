<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Location extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'name',
        'address_line1',
        'city',
        'country',
        'latitude',
        'longitude',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Location $location) {
            $location->uuid ??= (string) Str::uuid();
        });
    }

    public function branchGroups(): BelongsToMany
    {
        return $this->belongsToMany(BranchGroup::class, 'branch_group_locations')->withTimestamps();
    }

    public function branchOverrides(): HasMany
    {
        return $this->hasMany(BranchSettingOverride::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
