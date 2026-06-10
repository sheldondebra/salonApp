<?php

namespace App\Models;

use App\Enums\TenantStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'state',
        'country',
        'country_code',
        'latitude',
        'longitude',
        'website_url',
    ];

    protected function casts(): array
    {
        return [
            'status' => TenantStatus::class,
            'settings' => 'array',
            'trial_ends_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
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
        return $this->domains()->whereBool('is_primary');
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

    public function paymentSetting(): HasOne
    {
        return $this->hasOne(TenantPaymentSetting::class);
    }

    public function serviceCategories(): HasMany
    {
        return $this->hasMany(ServiceCategory::class);
    }

    public function marketplaceProfile(): HasOne
    {
        return $this->hasOne(MarketplaceProfile::class);
    }

    public function whiteLabelSetting(): HasOne
    {
        return $this->hasOne(WhiteLabelSetting::class);
    }

    public function paymentCommissions(): HasMany
    {
        return $this->hasMany(MarketplaceCommissionRule::class);
    }

    public function featuredListings(): HasMany
    {
        return $this->hasMany(FeaturedListing::class);
    }

    public function branchGroups(): HasMany
    {
        return $this->hasMany(BranchGroup::class);
    }

    public function branchSettingOverrides(): HasMany
    {
        return $this->hasMany(BranchSettingOverride::class);
    }

    public function marketingIntegrations(): HasMany
    {
        return $this->hasMany(MarketingIntegration::class);
    }

    public function trackingEvents(): HasMany
    {
        return $this->hasMany(TrackingEvent::class);
    }

    public function socialBookingLinks(): HasMany
    {
        return $this->hasMany(SocialBookingLink::class);
    }

    public function rebookingRules(): HasMany
    {
        return $this->hasMany(RebookingRule::class);
    }

    public function abandonedBookingSessions(): HasMany
    {
        return $this->hasMany(AbandonedBookingSession::class);
    }

    public function approvalRequests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
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

    public function portfolioGalleryItems(): HasMany
    {
        return $this->hasMany(PortfolioGalleryItem::class);
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
        $social = $this->setting('social', []);
        if (! is_array($social)) {
            $social = [];
        }

        $hours = $this->setting('opening_hours', []);
        if (! is_array($hours)) {
            $hours = [];
        }

        return [
            'logo_url' => $this->logo_url,
            'banner_url' => $this->banner_url,
            'primary_color' => $this->primary_color ?? config('tenant.default_primary_color'),
            'accent_color' => $this->accent_color ?? config('tenant.default_accent_color'),
            'tagline' => $this->tagline,
            'business_description' => $this->setting('business_description'),
            'business_phone' => $this->business_phone,
            'business_email' => $this->business_email,
            'whatsapp' => $this->setting('whatsapp'),
            'address' => $this->formattedAddress(),
            'address_line1' => $this->address_line1,
            'city' => $this->city,
            'country' => $this->country,
            'website_url' => $this->website_url,
            'social' => [
                'instagram' => $social['instagram'] ?? null,
                'facebook' => $social['facebook'] ?? null,
                'tiktok' => $social['tiktok'] ?? null,
                'twitter' => $social['twitter'] ?? null,
            ],
            'opening_hours' => array_values($hours),
        ];
    }

    public function formattedAddress(): ?string
    {
        $parts = array_filter([$this->address_line1, $this->city, $this->state, $this->country]);

        return $parts ? implode(', ', $parts) : null;
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        return data_get($this->settings ?? [], $key, $default);
    }

    public function businessTypeKey(): ?string
    {
        $key = $this->setting('business_type');

        return is_string($key) && $key !== '' ? $key : null;
    }

    public function businessTypeLabel(): ?string
    {
        $key = $this->businessTypeKey();

        return $key ? config("business_types.types.{$key}.label") : null;
    }

    /** Tenant opted in to multiple branches (SaaS setting per business). */
    public function multipleLocationsEnabled(): bool
    {
        return (bool) $this->setting(
            'multiple_locations',
            config('tenant.default_settings.multiple_locations', false)
        );
    }

    public function paymentsEnabled(): bool
    {
        return (bool) $this->setting(
            'payments.enabled',
            config('tenant.default_settings.payments.enabled', false)
        );
    }

    public function depositPercent(): int
    {
        return (int) $this->setting(
            'payments.deposit_percent',
            config('tenant.default_settings.payments.deposit_percent', 30)
        );
    }

    public function requireFullPayment(): bool
    {
        return (bool) $this->setting(
            'payments.require_full_payment',
            config('tenant.default_settings.payments.require_full_payment', false)
        );
    }

    /** @return array{enabled: bool, deposit_percent: int, require_full_payment: bool} */
    public function paymentSettings(): array
    {
        return [
            'enabled' => $this->paymentsEnabled(),
            'deposit_percent' => $this->depositPercent(),
            'require_full_payment' => $this->requireFullPayment(),
        ];
    }

    /** @return array<string, bool> */
    public function notificationSettings(): array
    {
        $stored = $this->setting('notifications', []);

        if (! is_array($stored)) {
            $stored = [];
        }

        return array_merge(config('notifications.defaults'), $stored);
    }

    /** @return array{allow_negative_stock: bool} */
    public function inventorySettings(): array
    {
        $defaults = config('tenant.default_settings.inventory', ['allow_negative_stock' => false]);
        $stored = $this->setting('inventory', []);

        if (! is_array($stored)) {
            $stored = [];
        }

        return array_merge($defaults, $stored);
    }

    public function activeLocationsCount(): int
    {
        return $this->locations()->whereBool('is_active')->count();
    }

    /**
     * How public booking treats locations for this tenant.
     * none = single-site salon (address on tenant row)
     * single = one branch record, auto-selected
     * multi = client picks a branch
     */
    public function bookingLocationMode(): string
    {
        if (! $this->multipleLocationsEnabled()) {
            return 'none';
        }

        $count = $this->activeLocationsCount();

        return match (true) {
            $count > 1 => 'multi',
            $count === 1 => 'single',
            default => 'none',
        };
    }
}
