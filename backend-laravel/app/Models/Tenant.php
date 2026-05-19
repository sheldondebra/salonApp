<?php

namespace App\Models;

use App\Enums\TenantStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'status',
        'plan',
        'timezone',
        'currency',
        'settings',
        'trial_ends_at',
        'logo_url',
        'banner_url',
        'primary_color',
        'accent_color',
        'tagline',
        'business_email',
        'business_phone',
        'address_line1',
        'city',
        'country',
        'website_url',
    ];

    protected function casts(): array
    {
        return [
            'status' => TenantStatus::class,
            'settings' => 'array',
            'trial_ends_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant) {
            $tenant->uuid ??= (string) Str::uuid();
            $tenant->primary_color ??= config('tenant.default_primary_color');
            $tenant->accent_color ??= config('tenant.default_accent_color');
        });
    }

    public function domains(): HasMany
    {
        return $this->hasMany(TenantDomain::class);
    }

    public function primaryDomain(): HasMany
    {
        return $this->domains()->where('is_primary', true);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->withPivot(['is_owner', 'joined_at'])
            ->withTimestamps();
    }

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    public function serviceCategories(): HasMany
    {
        return $this->hasMany(ServiceCategory::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function staffMembers(): HasMany
    {
        return $this->hasMany(StaffMember::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', TenantStatus::Active);
    }

    public function scopeBySlug(Builder $query, string $slug): Builder
    {
        return $query->where('slug', $slug);
    }

    public function branding(): array
    {
        return [
            'logo_url' => $this->logo_url,
            'banner_url' => $this->banner_url,
            'primary_color' => $this->primary_color ?? config('tenant.default_primary_color'),
            'accent_color' => $this->accent_color ?? config('tenant.default_accent_color'),
            'tagline' => $this->tagline,
            'business_phone' => $this->business_phone,
            'business_email' => $this->business_email,
            'address' => $this->formattedAddress(),
            'website_url' => $this->website_url,
        ];
    }

    public function formattedAddress(): ?string
    {
        $parts = array_filter([$this->address_line1, $this->city, $this->country]);

        return $parts ? implode(', ', $parts) : null;
    }
}
