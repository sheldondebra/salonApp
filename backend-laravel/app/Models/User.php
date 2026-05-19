<?php

namespace App\Models;

use App\Enums\OnboardingStatus;
use App\Enums\UserType;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * Spatie Permission guard — must match RolesAndPermissionsSeeder (`sanctum`).
     */
    protected string $guard_name = 'sanctum';

    protected $fillable = [
        'uuid',
        'name',
        'email',
        'phone',
        'avatar_url',
        'bio',
        'date_of_birth',
        'marketing_opt_in',
        'user_type',
        'account_intent',
        'onboarding_status',
        'selected_plan',
        'is_active',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'user_type' => UserType::class,
            'onboarding_status' => OnboardingStatus::class,
            'is_active' => 'boolean',
            'date_of_birth' => 'date',
            'marketing_opt_in' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            $user->uuid ??= (string) Str::uuid();
        });
    }

    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_user')
            ->withPivot(['is_owner', 'joined_at'])
            ->withTimestamps();
    }

    public function platformSubscriptions(): HasMany
    {
        return $this->hasMany(PlatformSubscription::class);
    }

    public function latestSubscription(): HasOne
    {
        return $this->hasOne(PlatformSubscription::class)->latestOfMany();
    }

    public function isSalonOwnerSignup(): bool
    {
        return $this->account_intent === 'salon_owner';
    }

    public function needsSubscriptionPayment(): bool
    {
        return $this->isSalonOwnerSignup()
            && $this->onboarding_status === OnboardingStatus::PaymentPending;
    }

    public function isSuperAdmin(): bool
    {
        return $this->user_type === UserType::SuperAdmin;
    }

    public function isPlatformAdmin(): bool
    {
        return $this->user_type?->isPlatformUser() ?? false;
    }

    public function canPermission(string $permission): bool
    {
        return \App\Support\PermissionChecker::allows($this, $permission);
    }
}
