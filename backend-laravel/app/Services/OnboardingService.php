<?php

namespace App\Services;

use App\Enums\OnboardingStatus;
use App\Enums\TenantStatus;
use App\Enums\UserType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class OnboardingService
{
    public function __construct(
        protected BusinessTypeService $businessTypes,
        protected TenantCatalogService $catalog,
    ) {}
    /** @return list<string> */
    public function stepKeys(): array
    {
        return collect(config('onboarding.steps', []))
            ->sortBy('order')
            ->keys()
            ->values()
            ->all();
    }

    public function stepLabel(string $key): string
    {
        return config("onboarding.steps.{$key}.label", ucfirst($key));
    }

    /**
     * @return array{steps: array<string, array{completed: bool, completed_at: string|null, data: array}>, current_step: string, percent: int, completed_count: int, total: int}
     */
    public function progressForUser(User $user): array
    {
        $tenant = $user->ownedTenant();

        if ($tenant) {
            return $this->progressForTenant($tenant);
        }

        return $this->progressFromSettings($user->onboarding_draft ?? [], null);
    }

    public function progressForTenant(Tenant $tenant): array
    {
        return $this->progressFromSettings($tenant->settings['onboarding'] ?? [], $tenant);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{tenant?: Tenant, progress: array}
     */
    public function saveStep(User $user, string $stepKey, array $data, bool $complete = true): array
    {
        $keys = $this->stepKeys();

        if (! in_array($stepKey, $keys, true)) {
            throw new \InvalidArgumentException("Unknown onboarding step: {$stepKey}");
        }

        if ($stepKey === 'business_type') {
            $types = $this->normalizeBusinessTypes($data);
            if ($types === []) {
                throw new \InvalidArgumentException('Select at least one business type.');
            }
            foreach ($types as $type) {
                $this->businessTypes->assertValid($type);
            }
        }

        $tenant = $user->ownedTenant();

        if ($stepKey === 'business' && ! $tenant && $user->onboarding_status === OnboardingStatus::Paid) {
            $tenant = $this->createTenantFromBusinessStep($user, $data);
        }

        if ($tenant) {
            $settings = $tenant->settings ?? [];
            $onboarding = $settings['onboarding'] ?? ['steps' => []];
            $onboarding['steps'][$stepKey] = [
                'completed' => $complete,
                'completed_at' => $complete ? now()->toIso8601String() : null,
                'data' => array_merge($onboarding['steps'][$stepKey]['data'] ?? [], $data),
            ];
            $onboarding['current_step'] = $this->nextStepKey($stepKey, $onboarding['steps']);
            $settings['onboarding'] = $onboarding;
            $attrs = $this->tenantAttributesForStep($stepKey, $data);
            if ($stepKey === 'location' && array_key_exists('multiple_locations', $data)) {
                $settings['multiple_locations'] = (bool) $data['multiple_locations'];
            }
            if ($stepKey === 'business_type') {
                $types = $this->normalizeBusinessTypes($data);
                if ($types !== []) {
                    $settings['business_types'] = $types;
                    $settings['business_type'] = $types[0];
                }
            }
            if ($stepKey === 'contact') {
                if (isset($data['social']) && is_array($data['social'])) {
                    $settings['social'] = $data['social'];
                }
                if (isset($data['extra_contacts']) && is_array($data['extra_contacts'])) {
                    $settings['extra_contacts'] = array_slice(
                        array_values(array_map(function (array $row): array {
                            return [
                                'label' => trim((string) ($row['label'] ?? '')),
                                'phone' => trim((string) ($row['phone'] ?? '')),
                                'email' => trim((string) ($row['email'] ?? '')),
                            ];
                        }, $data['extra_contacts'])),
                        0,
                        3
                    );
                }
            }
            if ($stepKey === 'location' && isset($data['additional_locations']) && is_array($data['additional_locations'])) {
                $settings['additional_locations'] = $data['additional_locations'];
            }
            $tenant->update(array_merge($attrs, ['settings' => $settings]));

            if ($stepKey === 'business_type' && $complete) {
                $types = $this->normalizeBusinessTypes($data);
                if ($types !== []) {
                    $this->businessTypes->applyMany($tenant->fresh(), $types);
                }
            }

            if ($stepKey === 'services' && isset($data['services']) && is_array($data['services'])) {
                $this->catalog->syncServices($tenant->fresh(), $data['services']);
            }

            if ($stepKey === 'gallery' && isset($data['items']) && is_array($data['items'])) {
                $this->catalog->syncGallery($tenant->fresh(), $data['items'], replace: true);
            }

            if ($stepKey === 'review' && $complete) {
                $this->finalizeOnboarding($user, $tenant);
            }

            return [
                'tenant' => $tenant->fresh(),
                'progress' => $this->progressFromSettings($onboarding, $tenant->fresh()),
            ];
        }

        if ($user->onboarding_status !== OnboardingStatus::Paid) {
            throw new \RuntimeException('Complete payment before onboarding.');
        }

        $draft = $user->onboarding_draft ?? ['steps' => []];
        $draft['steps'][$stepKey] = [
            'completed' => $complete,
            'completed_at' => $complete ? now()->toIso8601String() : null,
            'data' => array_merge($draft['steps'][$stepKey]['data'] ?? [], $data),
        ];
        $draft['current_step'] = $this->nextStepKey($stepKey, $draft['steps']);
        $user->update(['onboarding_draft' => $draft]);

        return [
            'progress' => $this->progressFromSettings($draft, null),
        ];
    }

    /**
     * @param  array<string, mixed>  $onboardingState
     */
    public function progressFromSettings(array $onboardingState, ?Tenant $tenant): array
    {
        $keys = $this->stepKeys();
        $stepsMeta = $onboardingState['steps'] ?? [];
        $steps = [];

        foreach ($keys as $key) {
            $entry = $stepsMeta[$key] ?? [];
            $steps[$key] = [
                'key' => $key,
                'label' => $this->stepLabel($key),
                'completed' => (bool) ($entry['completed'] ?? false),
                'completed_at' => $entry['completed_at'] ?? null,
                'data' => $entry['data'] ?? [],
            ];
        }

        $completedCount = collect($steps)->where('completed', true)->count();
        $total = count($keys);
        $percent = $total > 0 ? (int) round(($completedCount / $total) * 100) : 0;

        $current = $onboardingState['current_step'] ?? $this->firstIncompleteStep($steps) ?? $keys[0];

        $businessType = $tenant?->setting('business_type');

        return [
            'steps' => $steps,
            'current_step' => $current,
            'percent' => $percent,
            'completed_count' => $completedCount,
            'total' => $total,
            'tenant_slug' => $tenant?->slug,
            'tenant_uuid' => $tenant?->uuid,
            'business_type' => $businessType,
            'business_type_label' => $this->businessTypes->label($businessType),
        ];
    }

    /**
     * @param  array<string, array{completed?: bool}>  $steps
     */
    protected function nextStepKey(string $completedKey, array $steps): string
    {
        $keys = $this->stepKeys();
        $index = array_search($completedKey, $keys, true);

        if ($index === false) {
            return $keys[0];
        }

        for ($i = $index + 1; $i < count($keys); $i++) {
            if (empty($steps[$keys[$i]]['completed'])) {
                return $keys[$i];
            }
        }

        return $keys[count($keys) - 1];
    }

    /**
     * @param  array<string, array{completed?: bool}>  $steps
     */
    protected function firstIncompleteStep(array $steps): ?string
    {
        foreach ($this->stepKeys() as $key) {
            if (empty($steps[$key]['completed'])) {
                return $key;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function createTenantFromBusinessStep(User $user, array $data): Tenant
    {
        $validated = validator($data, [
            'business_name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:80', 'alpha_dash', 'unique:tenants,slug'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'currency' => ['nullable', 'string', 'size:3'],
        ])->validate();

        $plan = $user->selected_plan ?? 'starter';

        $tenant = Tenant::query()->create([
            'name' => $validated['business_name'],
            'slug' => Str::slug($validated['slug']),
            'status' => TenantStatus::Active,
            'plan' => $plan,
            'timezone' => $validated['timezone'] ?? 'UTC',
            'currency' => strtoupper($validated['currency'] ?? config('billing.currency', 'USD')),
            'settings' => array_merge(
                config('tenant.default_settings', ['multiple_locations' => false]),
                ['onboarding' => ['steps' => [], 'current_step' => 'business_type']]
            ),
        ]);

        $user->tenants()->attach($tenant->id, ['is_owner' => true, 'joined_at' => now()]);

        $registrar = app(PermissionRegistrar::class);
        $platformTeamId = config('tenant.platform_team_id', 0);
        $registrar->setPermissionsTeamId($platformTeamId);
        $role = Role::findByName('tenant_owner', 'sanctum');
        $registrar->setPermissionsTeamId($tenant->id);
        $user->assignRole($role);

        $user->update([
            'user_type' => UserType::TenantOwner,
            'onboarding_draft' => null,
        ]);

        return $tenant;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function tenantAttributesForStep(string $stepKey, array $data): array
    {
        $map = match ($stepKey) {
            'business' => [
                'name' => $data['business_name'] ?? null,
                'slug' => isset($data['slug']) ? Str::slug($data['slug']) : null,
                'timezone' => $data['timezone'] ?? null,
                'currency' => isset($data['currency']) ? strtoupper($data['currency']) : null,
            ],
            'contact' => [
                'business_phone' => $data['business_phone'] ?? null,
                'business_email' => $data['business_email'] ?? null,
            ],
            'branding' => [
                'tagline' => $data['tagline'] ?? null,
                'primary_color' => $data['primary_color'] ?? null,
                'accent_color' => $data['accent_color'] ?? null,
                'logo_url' => $data['logo_url'] ?? null,
            ],
            'location' => [
                'address_line1' => $data['address_line1'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
                'country' => $data['country'] ?? null,
                'country_code' => $data['country_code'] ?? null,
            ],
            default => [],
        };

        return array_filter($map, fn ($v) => $v !== null);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<string>
     */
    protected function normalizeBusinessTypes(array $data): array
    {
        if (isset($data['business_types']) && is_array($data['business_types'])) {
            return array_values(array_filter($data['business_types'], fn ($t) => is_string($t) && $t !== ''));
        }

        if (! empty($data['business_type']) && is_string($data['business_type'])) {
            return [$data['business_type']];
        }

        return [];
    }

    protected function finalizeOnboarding(User $user, Tenant $tenant): void
    {
        $user->update(['onboarding_status' => OnboardingStatus::Onboarded]);

        $settings = $tenant->settings ?? [];
        $onboarding = $settings['onboarding'] ?? [];
        $onboarding['completed_at'] = now()->toIso8601String();
        $settings['onboarding'] = $onboarding;
        $tenant->update(['settings' => $settings]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function adminOnboardingRows(): array
    {
        $rows = [];

        $paidWithoutTenant = User::query()
            ->where('account_intent', 'salon_owner')
            ->where('onboarding_status', OnboardingStatus::Paid)
            ->whereDoesntHave('tenants', fn ($q) => $q->whereRaw('"tenant_user"."is_owner" IS TRUE'))
            ->orderByDesc('created_at')
            ->get();

        foreach ($paidWithoutTenant as $user) {
            $progress = $this->progressFromSettings($user->onboarding_draft ?? [], null);
            $rows[] = [
                'type' => 'signup',
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'tenant_name' => null,
                'tenant_slug' => null,
                'onboarding_status' => $user->onboarding_status->value,
                'progress' => $progress,
            ];
        }

        $tenants = Tenant::query()
            ->with(['users' => fn ($q) => $q->whereRaw('"tenant_user"."is_owner" IS TRUE')])
            ->latest()
            ->get();

        foreach ($tenants as $tenant) {
            $owner = $tenant->users->first();
            $progress = $this->progressFromSettings($tenant->settings['onboarding'] ?? [], $tenant);

            $rows[] = [
                'type' => 'tenant',
                'user_id' => $owner?->id,
                'user_name' => $owner?->name,
                'user_email' => $owner?->email,
                'tenant_name' => $tenant->name,
                'tenant_slug' => $tenant->slug,
                'business_type' => $tenant->setting('business_type'),
                'business_type_label' => $this->businessTypes->label($tenant->setting('business_type')),
                'onboarding_status' => $owner?->onboarding_status?->value,
                'progress' => $progress,
            ];
        }

        return $rows;
    }
}
