<?php

namespace App\Models;

use App\Enums\OnboardingStatus;
use App\Enums\UserType;
use App\Models\Appointment;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements CanResetPasswordContract
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use CanResetPassword, FixesPgsqlBooleans, HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

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
        'onboarding_draft',
        'is_active',
        'is_blocked',
        'last_login_at',
        'last_login_ip',
        'last_login_user_agent',
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
            'is_blocked' => 'boolean',
            'last_login_at' => 'datetime',
            'date_of_birth' => 'date',
            'marketing_opt_in' => 'boolean',
            'onboarding_draft' => 'array',
        ];
    }

    public function ownedTenant(): ?Tenant
    {
        return $this->tenants()->whereRaw('"tenant_user"."is_owner" IS TRUE')->first();
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

    public function clientAppointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'client_user_id');
    }

    public function loginLogs(): HasMany
    {
        return $this->hasMany(UserLoginLog::class)->orderByDesc('logged_in_at');
    }

    public function platformSubscriptions(): HasMany
    {
        return $this->hasMany(PlatformSubscription::class);
    }

    /** Salon/platform accounts visible in General Office — excludes booking clients. */
    public function scopeVisibleToPlatformAdmin(Builder $query): Builder
    {
        return $query->whereNot('user_type', UserType::Client);
    }

    public function scopeWithTrashedIncluded(Builder $query, bool $include): Builder
    {
        return $include ? $query->withTrashed() : $query;
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
