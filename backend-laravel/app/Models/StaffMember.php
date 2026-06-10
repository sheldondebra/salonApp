<?php

namespace App\Models;

use App\Enums\StaffEmploymentMode;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Str;

class StaffMember extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_ON_LEAVE = 'on_leave';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_TERMINATED = 'terminated';

    protected $fillable = [
        'tenant_id',
        'location_id',
        'user_id',
        'uuid',
        'display_name',
        'initials',
        'title',
        'bio',
        'avatar_url',
        'is_bookable',
        'is_active',
        'employment_status',
        'employment_type',
        'employment_mode',
        'self_employed_settings',
        'hire_date',
        'color_code',
    ];

    protected function casts(): array
    {
        return [
            'is_bookable' => 'boolean',
            'is_active' => 'boolean',
            'employment_mode' => StaffEmploymentMode::class,
            'self_employed_settings' => 'array',
            'hire_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (StaffMember $staff) {
            $staff->uuid ??= (string) Str::uuid();
            if (! $staff->initials && $staff->display_name) {
                $staff->initials = self::makeInitials($staff->display_name);
            }
        });

        static::saving(function (StaffMember $staff) {
            if ($staff->isDirty('display_name') && ! $staff->initials) {
                $staff->initials = self::makeInitials($staff->display_name);
            }
        });
    }

    public static function makeInitials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $letters = '';
        foreach (array_slice($parts, 0, 2) as $part) {
            $letters .= mb_strtoupper(mb_substr($part, 0, 1));
        }

        return $letters !== '' ? $letters : '?';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function staffServices(): HasMany
    {
        return $this->hasMany(StaffService::class);
    }

    public function activeStaffServices(): HasMany
    {
        return $this->staffServices()->whereBool('is_active', true);
    }

    public function services(): HasManyThrough
    {
        return $this->hasManyThrough(
            Service::class,
            StaffService::class,
            'staff_member_id',
            'id',
            'id',
            'service_id'
        )->where('staff_services.is_active', true);
    }

    public function workingHours(): HasMany
    {
        return $this->hasMany(StaffWorkingHour::class)->orderBy('day_of_week');
    }

    public function breaks(): HasMany
    {
        return $this->hasMany(StaffBreak::class);
    }

    public function timeOffRequests(): HasMany
    {
        return $this->hasMany(StaffTimeOffRequest::class);
    }

    public function payrollProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(StaffPayrollProfile::class);
    }

    public function chairRentalProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ChairRentalProfile::class);
    }
}
