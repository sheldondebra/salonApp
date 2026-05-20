<?php

namespace Database\Seeders;

use App\Enums\TenantStatus;
use App\Enums\UserType;
use App\Models\Appointment;
use App\Models\Location;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\StaffMember;
use App\Models\StaffService;
use App\Enums\TenantDomainType;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\Coupon;
use App\Models\LoyaltyTransaction;
use App\Models\LoyaltyWallet;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);
        $platformTeamId = config('tenant.platform_team_id', 0);

        $registrar->setPermissionsTeamId($platformTeamId);

        Coupon::query()->updateOrCreate(
            ['code' => 'WELCOME20', 'tenant_id' => null],
            [
                'type' => 'percent',
                'value' => 20,
                'scope' => 'subscription',
                'max_redemptions' => 1000,
                'is_active' => true,
                'expires_at' => now()->addYear(),
            ]
        );

        Coupon::query()->updateOrCreate(
            ['code' => 'SAVE10', 'tenant_id' => null],
            [
                'type' => 'fixed',
                'value' => 1000,
                'scope' => 'subscription',
                'max_redemptions' => null,
                'is_active' => true,
            ]
        );

        $superAdmin = User::query()->updateOrCreate(
            ['email' => 'admin@salonapp.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'user_type' => UserType::SuperAdmin,
                'is_active' => true,
            ]
        );
        $superAdmin->syncRoles([Role::findByName('super_admin', 'sanctum')]);

        $officeAdmin = User::query()->updateOrCreate(
            ['email' => 'office@salonapp.com'],
            [
                'name' => 'Office Admin',
                'password' => Hash::make('password'),
                'user_type' => UserType::OfficeAdmin,
                'is_active' => true,
            ]
        );
        $officeAdmin->syncRoles([Role::findByName('office_admin', 'sanctum')]);

        $tenant = Tenant::query()->updateOrCreate(
            ['slug' => 'luxe-bloom'],
            [
                'name' => 'Luxe Bloom Studio',
                'status' => TenantStatus::Active,
                'plan' => 'professional',
                'timezone' => 'America/New_York',
                'currency' => 'GHS',
                'logo_url' => null,
                'banner_url' => null,
                'primary_color' => '#F8BBD0',
                'accent_color' => '#E879A6',
                'tagline' => 'Where beauty meets calm',
                'business_phone' => '+1 (555) 010-2000',
                'business_email' => 'hello@luxebloom.demo',
                'address_line1' => '128 Rose Avenue',
                'city' => 'Miami',
                'country' => 'US',
                'website_url' => 'https://luxebloom.demo',
                'settings' => [
                    'payments' => [
                        'enabled' => true,
                        'deposit_percent' => 30,
                        'require_full_payment' => false,
                    ],
                ],
            ]
        );

        TenantDomain::query()->updateOrCreate(
            ['domain' => 'book.luxebloom.demo'],
            [
                'tenant_id' => $tenant->id,
                'type' => TenantDomainType::Custom,
                'is_primary' => true,
                'verified_at' => now(),
            ]
        );

        $registrar->setPermissionsTeamId($tenant->id);

        $owner = $this->seedTenantUser($tenant, 'owner@luxebloom.demo', 'Ava Sterling', UserType::TenantOwner, 'tenant_owner', true);
        $manager = $this->seedTenantUser($tenant, 'manager@luxebloom.demo', 'Jordan Lee', UserType::Manager, 'manager');
        $staffUser = $this->seedTenantUser($tenant, 'maya@luxebloom.demo', 'Maya Chen', UserType::Staff, 'staff');
        $client = $this->seedTenantUser($tenant, 'client@example.com', 'Emma Wilson', UserType::Client, 'client');

        Coupon::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'code' => 'BOOK15'],
            [
                'type' => 'percent',
                'value' => 15,
                'scope' => 'booking',
                'max_redemptions' => 500,
                'is_active' => true,
                'expires_at' => now()->addMonths(6),
            ]
        );

        $location = Location::withoutGlobalScope('tenant')->updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Luxe Bloom — Flagship'],
            ['city' => 'Miami', 'country' => 'US', 'is_active' => true]
        );

        $hair = ServiceCategory::withoutGlobalScope('tenant')->updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Hair'],
            ['sort_order' => 1, 'is_active' => true]
        );
        $nails = ServiceCategory::withoutGlobalScope('tenant')->updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Nails'],
            ['sort_order' => 2, 'is_active' => true]
        );
        $wellness = ServiceCategory::withoutGlobalScope('tenant')->updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Wellness'],
            ['sort_order' => 3, 'is_active' => true]
        );

        $services = [
            ['category' => $hair, 'name' => 'Signature Blowout', 'duration' => 45, 'price' => 6500],
            ['category' => $hair, 'name' => 'Balayage Color', 'duration' => 150, 'price' => 18500],
            ['category' => $nails, 'name' => 'Gel Manicure', 'duration' => 60, 'price' => 5500],
            ['category' => $nails, 'name' => 'Luxury Pedicure', 'duration' => 75, 'price' => 7200],
            ['category' => $wellness, 'name' => 'Aromatherapy Massage', 'duration' => 90, 'price' => 12000],
        ];

        $serviceModels = [];
        foreach ($services as $item) {
            $serviceModels[] = Service::withoutGlobalScope('tenant')->updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $item['name']],
                [
                    'service_category_id' => $item['category']->id,
                    'description' => 'Premium '.$item['name'].' experience.',
                    'duration_minutes' => $item['duration'],
                    'price_cents' => $item['price'],
                    'is_active' => true,
                ]
            );
        }

        $staffMember = StaffMember::withoutGlobalScope('tenant')->updateOrCreate(
            ['tenant_id' => $tenant->id, 'user_id' => $staffUser->id],
            [
                'location_id' => $location->id,
                'display_name' => 'Maya Chen',
                'title' => 'Senior Stylist',
                'employment_type' => 'full_time',
                'employment_status' => StaffMember::STATUS_ACTIVE,
                'hire_date' => now()->subYears(2)->toDateString(),
                'color_code' => '#E879A6',
                'is_bookable' => true,
                'is_active' => true,
            ]
        );

        foreach (array_slice($serviceModels, 0, 3) as $svc) {
            StaffService::withoutGlobalScope('tenant')->updateOrCreate(
                [
                    'staff_member_id' => $staffMember->id,
                    'service_id' => $svc->id,
                ],
                [
                    'tenant_id' => $tenant->id,
                    'is_active' => true,
                ]
            );
        }

        foreach ([0, 1, 2, 3, 4, 5, 6] as $dayOffset) {
            $date = Carbon::today()->subDays(6 - $dayOffset);
            Appointment::withoutGlobalScope('tenant')->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'starts_at' => $date->copy()->setTime(10, 0),
                ],
                [
                    'client_user_id' => $client->id,
                    'staff_member_id' => $staffMember->id,
                    'service_id' => $serviceModels[$dayOffset % count($serviceModels)]->id,
                    'location_id' => $location->id,
                    'ends_at' => $date->copy()->setTime(11, 0),
                    'status' => $dayOffset < 5 ? 'completed' : 'confirmed',
                ]
            );
        }

        Appointment::withoutGlobalScope('tenant')->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'starts_at' => Carbon::tomorrow()->setTime(14, 0),
            ],
            [
                'client_user_id' => $client->id,
                'staff_member_id' => $staffMember->id,
                'service_id' => $serviceModels[0]->id,
                'location_id' => $location->id,
                'ends_at' => Carbon::tomorrow()->setTime(14, 45),
                'status' => 'pending',
            ]
        );

        $wallet = LoyaltyWallet::query()->updateOrCreate(
            ['user_id' => $client->id, 'tenant_id' => $tenant->id],
            ['points_balance' => 420, 'lifetime_points' => 1280]
        );

        LoyaltyTransaction::query()->updateOrCreate(
            ['loyalty_wallet_id' => $wallet->id, 'description' => 'Welcome bonus'],
            ['points' => 100, 'type' => 'bonus']
        );

        unset($owner, $manager, $staffUser, $client);
    }

    protected function seedTenantUser(
        Tenant $tenant,
        string $email,
        string $name,
        UserType $type,
        string $roleName,
        bool $isOwner = false
    ): User {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'user_type' => $type,
                'is_active' => true,
            ]
        );

        if (! $user->tenants()->where('tenants.id', $tenant->id)->exists()) {
            $user->tenants()->attach($tenant->id, [
                'is_owner' => $isOwner,
                'joined_at' => now(),
            ]);
        }

        $registrar = app(PermissionRegistrar::class);
        $platformTeamId = config('tenant.platform_team_id', 0);

        $registrar->setPermissionsTeamId($platformTeamId);
        $role = Role::findByName($roleName, 'sanctum');

        $registrar->setPermissionsTeamId($tenant->id);
        $user->syncRoles([$role]);

        return $user;
    }
}
