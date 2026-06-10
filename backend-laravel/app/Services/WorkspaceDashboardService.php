<?php

namespace App\Services;

use App\Enums\AbandonedBookingStatus;
use App\Enums\ApprovalRequestStatus;
use App\Enums\FeaturedListingStatus;
use App\Enums\MarketingIntegrationProvider;
use App\Models\AbandonedBookingSession;
use App\Models\ApprovalRequest;
use App\Models\BookingAttribution;
use App\Models\BranchGroup;
use App\Models\ChairRentalProfile;
use App\Models\FeaturedListing;
use App\Models\Location;
use App\Models\MarketplaceCommissionRule;
use App\Models\MarketplaceProfile;
use App\Models\RebookingRule;
use App\Models\SocialBookingLink;
use App\Models\Tenant;
use App\Models\TrackingEvent;
use App\Models\WhiteLabelSetting;
use App\Support\ReportFilters;
use Carbon\Carbon;

class WorkspaceDashboardService
{
    public function __construct(
        private readonly AbandonedBookingService $abandoned,
        private readonly RebookingRuleService $rebooking,
        private readonly BranchComparisonService $branchComparison,
    ) {}

    /** @return array<string, mixed> */
    public function abandonedBookingsOverview(int $tenantId, ?string $status = null): array
    {
        $analytics = $this->abandoned->analytics($tenantId);
        $openQuery = AbandonedBookingSession::query()
            ->where('tenant_id', $tenantId)
            ->where('status', AbandonedBookingStatus::Abandoned);

        if ($status) {
            $openQuery->where('status', $status);
        }

        $openSessions = (clone $openQuery)->count();
        $queue = (clone $openQuery)
            ->latest('last_activity_at')
            ->limit(50)
            ->get()
            ->map(fn (AbandonedBookingSession $session, int $index) => $this->formatAbandonedQueueItem($session, $index + 1))
            ->values()
            ->all();

        $sources = collect($analytics['sources'] ?? []);
        $campaigns = $sources->map(function (array $row, int $index) use ($tenantId) {
            $source = (string) ($row['source'] ?? 'unknown');
            $total = (int) ($row['total'] ?? 0);
            $recovered = AbandonedBookingSession::query()
                ->where('tenant_id', $tenantId)
                ->where('source', $source === 'unknown' ? null : $source)
                ->where('status', AbandonedBookingStatus::Recovered)
                ->count();

            return [
                'id' => $index + 1,
                'name' => ucfirst(str_replace('_', ' ', $source)).' recovery',
                'channel' => 'sms',
                'status' => $total > 0 ? 'live' : 'draft',
                'trigger_minutes' => 30,
                'sent_count' => (int) AbandonedBookingSession::query()
                    ->where('tenant_id', $tenantId)
                    ->where('source', $source === 'unknown' ? null : $source)
                    ->sum('reminder_count'),
                'recovered_bookings' => $recovered,
                'recovery_rate_percent' => $total > 0 ? round(($recovered / $total) * 100, 1) : 0,
                'updated_at' => now()->toIso8601String(),
            ];
        })->values()->all();

        return [
            'summary' => [
                'open_abandoned' => $openSessions,
                'recovered_bookings' => (int) ($analytics['recovered_sessions'] ?? 0),
                'recovery_rate_percent' => (float) ($analytics['recovery_rate_percent'] ?? 0),
                'revenue_recovered_cents' => 0,
            ],
            'campaigns' => $campaigns,
            'queue' => $queue,
        ];
    }

    /** @return array<string, mixed> */
    public function abandonedBookingsMobile(int $tenantId, ?string $status = null): array
    {
        $overview = $this->abandonedBookingsOverview($tenantId, $status);

        return [
            'summary' => [
                'open_sessions' => $overview['summary']['open_abandoned'],
                'recovered_count' => $overview['summary']['recovered_bookings'],
                'recovered_value_cents' => $overview['summary']['revenue_recovered_cents'],
                'automations_live' => count(array_filter($overview['campaigns'], fn (array $row) => $row['status'] === 'live')),
            ],
            'automation' => [
                'sms' => true,
                'email' => true,
                'whatsapp' => false,
                'delay_minutes' => 30,
            ],
            'sessions' => collect($overview['queue'])->map(fn (array $row) => [
                'id' => $row['id'],
                'client_name' => $row['client_name'],
                'service_name' => $row['service_name'],
                'branch_name' => $row['branch_name'],
                'abandoned_at' => $row['abandoned_at'],
                'reminder_state' => $row['reminder_at'] ? 'scheduled' : 'pending',
                'recovery_value_cents' => $row['estimated_value_cents'],
                'status' => $row['status'],
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function rebookingOverview(int $tenantId): array
    {
        $rules = RebookingRule::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active', true)
            ->with(['service:id,name', 'staffMember:id,display_name'])
            ->get();

        $rawSuggestions = $this->rebooking->suggestions($tenantId);
        $suggestions = collect($rawSuggestions)->values()->map(function (array $row, int $index) {
            return [
                'id' => $index + 1,
                'client_name' => (string) ($row['client_name'] ?? 'Client'),
                'recommended_service' => $row['service_name'] ?? null,
                'assigned_staff_name' => $row['staff_name'] ?? null,
                'last_visit_at' => $row['last_visit_at'] ?? null,
                'suggested_date' => $row['recommended_send_at'] ?? null,
                'likelihood_label' => ($row['days_since_last_visit'] ?? 0) > 60 ? 'High' : 'Medium',
                'lifetime_value_cents' => 0,
            ];
        })->all();

        $segments = $rules->map(function (RebookingRule $rule) use ($rawSuggestions) {
            $matches = collect($rawSuggestions)->filter(fn (array $row) => ($row['rule_uuid'] ?? null) === $rule->uuid);

            return [
                'label' => $rule->name,
                'clients' => $matches->count(),
                'projected_revenue_cents' => $matches->count() * 15000,
            ];
        })->values()->all();

        return [
            'summary' => [
                'due_clients' => count($rawSuggestions),
                'auto_campaigns' => $rules->filter(fn (RebookingRule $rule) => (bool) $rule->auto_send_reminder)->count(),
                'booked_from_campaigns' => 0,
                'projected_revenue_cents' => collect($segments)->sum('projected_revenue_cents'),
            ],
            'segments' => $segments,
            'suggestions' => $suggestions,
        ];
    }

    /** @return array<string, mixed> */
    public function rebookingMobile(int $tenantId): array
    {
        $overview = $this->rebookingOverview($tenantId);
        $rules = RebookingRule::query()->where('tenant_id', $tenantId)->latest()->get();

        return [
            'summary' => [
                'due_this_week' => $overview['summary']['due_clients'],
                'rules' => $rules->count(),
                'scheduled_reminders' => $overview['summary']['auto_campaigns'],
                'recovered_clients' => $overview['summary']['booked_from_campaigns'],
            ],
            'rules' => $rules->map(fn (RebookingRule $rule, int $index) => [
                'id' => $rule->id ?: $index + 1,
                'label' => $rule->name,
                'cadence_days' => (int) $rule->days_after_visit,
                'scope' => $rule->service?->name ?? 'All services',
                'active' => (bool) $rule->is_active,
            ])->values()->all(),
            'suggestions' => collect($overview['suggestions'])->map(fn (array $row) => [
                'id' => $row['id'],
                'client_name' => $row['client_name'],
                'service_name' => $row['recommended_service'] ?? 'Follow-up visit',
                'due_on' => $row['suggested_date'],
                'staff_name' => $row['assigned_staff_name'],
                'confidence' => $row['likelihood_label'],
                'channel' => 'sms',
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function socialLinksOverview(int $tenantId, Tenant $tenant): array
    {
        $links = SocialBookingLink::query()->where('tenant_id', $tenantId)->latest()->get();
        $attributions = BookingAttribution::query()->where('tenant_id', $tenantId)->count();

        return [
            'profile_views' => (int) $links->sum('click_count'),
            'link_clicks' => (int) $links->sum('click_count'),
            'bookings_from_social' => $attributions,
            'bio' => $tenant->tagline,
            'share_url' => url('/book/'.$tenant->slug),
            'links' => $links->map(fn (SocialBookingLink $link) => [
                'platform' => $link->platform,
                'label' => ucfirst($link->platform),
                'url' => $link->url,
                'clicks' => (int) $link->click_count,
                'conversions' => 0,
                'is_active' => (bool) $link->is_active,
                'last_synced_at' => $link->updated_at?->toIso8601String(),
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function socialLinksMobile(int $tenantId): array
    {
        $tenant = Tenant::query()->findOrFail($tenantId);
        $overview = $this->socialLinksOverview($tenantId, $tenant);
        $top = collect($overview['links'])->sortByDesc('clicks')->first();

        return [
            'summary' => [
                'links' => count($overview['links']),
                'clicks' => $overview['link_clicks'],
                'bookings' => $overview['bookings_from_social'],
                'top_platform' => is_array($top) ? ($top['platform'] ?? null) : null,
            ],
            'share_copy' => $overview['share_url'],
            'links' => collect($overview['links'])->map(fn (array $row) => [
                'platform' => $row['platform'],
                'handle' => parse_url((string) $row['url'], PHP_URL_HOST),
                'url' => $row['url'],
                'clicks' => $row['clicks'],
                'bookings' => $row['conversions'],
                'qr_ready' => true,
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function integrationsSettings(int $tenantId): array
    {
        $integrations = collect(MarketingIntegrationProvider::cases())
            ->map(function (MarketingIntegrationProvider $provider) use ($tenantId) {
                $integration = \App\Models\MarketingIntegration::query()->firstOrCreate(
                    ['tenant_id' => $tenantId, 'provider' => $provider],
                    ['config' => [], 'is_active' => false, 'consent_required' => true]
                );
                $config = is_array($integration->config) ? $integration->config : [];

                return [
                    'provider' => $provider->value,
                    'is_active' => (bool) $integration->is_active,
                    'config' => $config,
                    'updated_at' => $integration->updated_at,
                ];
            });

        $ga = $integrations->firstWhere('provider', MarketingIntegrationProvider::GoogleAnalytics->value);
        $meta = $integrations->firstWhere('provider', MarketingIntegrationProvider::MetaPixel->value);
        $gaConfig = is_array($ga['config'] ?? null) ? $ga['config'] : [];
        $metaConfig = is_array($meta['config'] ?? null) ? $meta['config'] : [];

        $events = [
            ['key' => 'booking_started', 'label' => 'Booking started', 'category' => 'Funnel', 'destination' => 'ga'],
            ['key' => 'service_selected', 'label' => 'Service selected', 'category' => 'Funnel', 'destination' => 'ga'],
            ['key' => 'booking_completed', 'label' => 'Booking completed', 'category' => 'Conversion', 'destination' => 'ga'],
            ['key' => 'booking_started', 'label' => 'Booking started', 'category' => 'Funnel', 'destination' => 'meta_pixel'],
            ['key' => 'booking_completed', 'label' => 'Booking completed', 'category' => 'Conversion', 'destination' => 'meta_pixel'],
        ];

        $lastSent = TrackingEvent::query()
            ->where('tenant_id', $tenantId)
            ->selectRaw('event_name, provider, MAX(created_at) as last_sent_at')
            ->groupBy('event_name', 'provider')
            ->get()
            ->keyBy(fn ($row) => $row->event_name.'|'.$row->provider);

        $catalog = collect($events)->map(function (array $event) use ($lastSent, $ga, $meta) {
            $provider = $event['destination'] === 'ga'
                ? MarketingIntegrationProvider::GoogleAnalytics->value
                : MarketingIntegrationProvider::MetaPixel->value;
            $sent = $lastSent->get($event['key'].'|'.$provider);
            $enabled = $event['destination'] === 'ga'
                ? (bool) ($ga['is_active'] ?? false)
                : (bool) ($meta['is_active'] ?? false);

            return [
                'key' => $event['key'],
                'label' => $event['label'],
                'category' => $event['category'],
                'destination' => $event['destination'],
                'enabled' => $enabled,
                'last_sent_at' => $sent?->last_sent_at ? Carbon::parse($sent->last_sent_at)->toIso8601String() : null,
            ];
        })->values()->all();

        $updatedAt = collect([$ga['updated_at'] ?? null, $meta['updated_at'] ?? null])->filter()->max();

        return [
            'ga_enabled' => (bool) ($ga['is_active'] ?? false),
            'ga_measurement_id' => $gaConfig['measurement_id'] ?? null,
            'ga_api_secret_masked' => isset($gaConfig['api_secret']) ? '••••••••' : null,
            'meta_enabled' => (bool) ($meta['is_active'] ?? false),
            'meta_pixel_id' => $metaConfig['pixel_id'] ?? null,
            'meta_access_token_masked' => isset($metaConfig['access_token']) ? '••••••••' : null,
            'consent_mode' => 'balanced',
            'updated_at' => $updatedAt ? Carbon::parse($updatedAt)->toIso8601String() : null,
            'event_catalog' => $catalog,
        ];
    }

    /** @return array<string, mixed> */
    public function marketplaceFeaturedOverview(int $tenantId, Tenant $tenant): array
    {
        $listings = FeaturedListing::query()
            ->where('tenant_id', $tenantId)
            ->latest()
            ->get();

        $active = $listings->filter(fn (FeaturedListing $listing) => ($listing->status?->value ?? $listing->status) === FeaturedListingStatus::Active->value);

        return [
            'summary' => [
                'active_slots' => $active->count(),
                'waitlist_count' => max(0, $listings->count() - $active->count()),
                'click_through_rate_percent' => $active->count() > 0 ? 12.5 : 0,
                'bookings_generated' => BookingAttribution::query()->where('tenant_id', $tenantId)->count(),
            ],
            'placements' => $listings->values()->map(function (FeaturedListing $listing, int $index) use ($tenant) {
                return [
                    'id' => $listing->id,
                    'marketplace_profile_id' => $tenant->id,
                    'business_name' => $tenant->name,
                    'city' => $tenant->city,
                    'slot' => $index + 1,
                    'starts_at' => $listing->starts_at?->toIso8601String(),
                    'ends_at' => $listing->ends_at?->toIso8601String(),
                    'status' => $listing->status?->value ?? $listing->status,
                ];
            })->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function marketplaceCommissionsOverview(int $tenantId): array
    {
        $rules = MarketplaceCommissionRule::query()->where('tenant_id', $tenantId)->latest()->get();
        $attributions = BookingAttribution::query()->where('tenant_id', $tenantId)->with('appointment.service')->latest()->limit(50)->get();

        $records = $attributions->map(function (BookingAttribution $row, int $index) use ($rules) {
            $rule = $rules->first();
            $gross = (int) ($row->appointment?->service?->price_cents ?? 10000);
            $rate = $rule ? (int) $rule->percent : 10;

            return [
                'id' => $row->id ?: $index + 1,
                'partner_name' => (string) ($row->source ?? 'Marketplace'),
                'booking_reference' => $row->appointment?->uuid ?? ('APT-'.$row->appointment_id),
                'service_name' => $row->appointment?->service?->name,
                'commission_rate' => $rate,
                'gross_cents' => $gross,
                'commission_cents' => (int) round($gross * ($rate / 100)) + (int) ($rule?->flat_fee_cents ?? 0),
                'status' => 'pending',
                'payable_at' => now()->addDays(7)->toIso8601String(),
            ];
        })->values()->all();

        $pending = collect($records)->sum('commission_cents');

        return [
            'summary' => [
                'pending_cents' => $pending,
                'paid_cents' => 0,
                'bookings' => count($records),
                'average_rate' => $rules->avg('percent') ?: 0,
            ],
            'records' => $records,
        ];
    }

    /** @return array<string, mixed> */
    public function marketplaceWorkspaceProfile(MarketplaceProfile $profile, Tenant $tenant): array
    {
        $photos = collect($profile->photos ?? [])->filter()->values();
        $categories = collect($profile->categories ?? [])->filter()->values();

        return [
            'id' => $profile->id,
            'slug' => $tenant->slug,
            'business_name' => $tenant->name,
            'headline' => $profile->headline,
            'description' => $profile->bio,
            'cover_image_url' => $photos->first(),
            'logo_url' => $tenant->logo_url,
            'city' => $tenant->city,
            'region' => $tenant->region ?? $tenant->country,
            'rating' => (float) $profile->average_rating,
            'review_count' => (int) $profile->review_count,
            'booking_url' => url('/book/'.$tenant->slug),
            'accepts_walkins' => true,
            'is_featured' => FeaturedListing::query()
                ->where('tenant_id', $tenant->id)
                ->where('status', FeaturedListingStatus::Active)
                ->exists(),
            'listing_status' => $profile->is_published ? 'published' : 'draft',
            'specialties' => $categories->take(6)->all(),
            'service_tags' => $tenant->services()->limit(8)->pluck('name')->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function marketplaceMobileProfile(MarketplaceProfile $profile, Tenant $tenant): array
    {
        return [
            'published' => (bool) $profile->is_published,
            'salon_name' => $tenant->name,
            'headline' => $profile->headline,
            'rating' => (float) $profile->average_rating,
            'review_count' => (int) $profile->review_count,
            'categories' => $profile->categories ?? [],
            'services' => $tenant->services()->limit(6)->get()->map(fn ($service) => [
                'id' => $service->id,
                'name' => $service->name,
                'price_from_cents' => (int) $service->price_cents,
            ])->values()->all(),
            'photos' => collect($profile->photos ?? [])->values()->map(fn ($url, int $index) => [
                'id' => $index + 1,
                'url' => $url,
                'caption' => null,
            ])->all(),
            'location' => [
                'city' => (string) ($tenant->city ?? ''),
                'branch_count' => $tenant->locations()->count(),
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function branchGroupsOverview(int $tenantId): array
    {
        $groups = BranchGroup::query()
            ->where('tenant_id', $tenantId)
            ->with(['manager:id,name', 'locations:id,name,city'])
            ->latest()
            ->get();

        $locations = Location::query()->where('tenant_id', $tenantId)->get();
        $assignedIds = $groups->flatMap(fn (BranchGroup $group) => $group->locations->pluck('id'))->unique();

        $regions = $locations
            ->pluck('city')
            ->filter()
            ->unique()
            ->values()
            ->map(fn (string $city, int $index) => [
                'id' => $index + 1,
                'name' => $city,
                'manager_name' => null,
                'branch_count' => $locations->where('city', $city)->count(),
            ])
            ->all();

        return [
            'summary' => [
                'regions' => count($regions),
                'groups' => $groups->count(),
                'covered_branches' => $assignedIds->count(),
                'unassigned_branches' => max(0, $locations->count() - $assignedIds->count()),
            ],
            'regions' => $regions,
            'groups' => $groups->map(fn (BranchGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
                'region_name' => $group->locations->first()?->city,
                'branch_count' => $group->locations->count(),
                'branch_names' => $group->locations->pluck('name')->all(),
                'is_active' => true,
                'manager_name' => $group->manager?->name,
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function chairRentalsOverview(int $tenantId): array
    {
        $profiles = ChairRentalProfile::query()
            ->where('tenant_id', $tenantId)
            ->with('staffMember:id,display_name')
            ->latest()
            ->get();

        $active = $profiles->filter(fn (ChairRentalProfile $profile) => (bool) $profile->is_active);
        $monthly = $active->sum(fn (ChairRentalProfile $profile) => (int) $profile->rental_fee_cents);

        return [
            'summary' => [
                'active_rentals' => $active->count(),
                'monthly_recurring_cents' => (int) $monthly,
                'occupancy_rate_percent' => $profiles->count() > 0 ? round(($active->count() / $profiles->count()) * 100) : 0,
                'outstanding_cents' => 0,
            ],
            'agreements' => $profiles->map(fn (ChairRentalProfile $profile, int $index) => [
                'id' => $profile->id ?: $index + 1,
                'renter_name' => $profile->staffMember?->display_name ?? 'Unassigned',
                'chair_label' => 'Chair '.($index + 1),
                'branch_name' => null,
                'status' => $profile->is_active ? 'active' : 'ended',
                'billing_cycle' => (string) ($profile->billing_interval?->value ?? $profile->billing_interval ?? 'monthly'),
                'rent_cents' => (int) $profile->rental_fee_cents,
                'deposit_cents' => 0,
                'next_invoice_at' => now()->addMonth()->toIso8601String(),
                'occupancy_since' => $profile->created_at?->toIso8601String(),
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function chairRentalsMobile(int $tenantId): array
    {
        $overview = $this->chairRentalsOverview($tenantId);

        return [
            'summary' => [
                'active_renters' => $overview['summary']['active_rentals'],
                'occupied_chairs' => $overview['summary']['active_rentals'],
                'revenue_cents' => $overview['summary']['monthly_recurring_cents'],
                'overdue_invoices' => 0,
            ],
            'renters' => collect($overview['agreements'])->map(fn (array $row) => [
                'id' => $row['id'],
                'chair_name' => $row['chair_label'],
                'renter_name' => $row['renter_name'],
                'status' => $row['status'],
                'weekly_fee_cents' => (int) round($row['rent_cents'] / 4),
                'next_invoice_due' => $row['next_invoice_at'],
                'payout_mode' => 'bank',
                'days_booked' => 5,
            ])->all(),
            'schedule' => collect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])->map(fn (string $day) => [
                'day' => $day,
                'occupied' => $overview['summary']['active_rentals'],
                'total' => max(1, count($overview['agreements'])),
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function approvalsInbox(int $tenantId): array
    {
        $items = ApprovalRequest::query()
            ->where('tenant_id', $tenantId)
            ->with(['requestedBy:id,name'])
            ->latest()
            ->limit(50)
            ->get();

        $today = now()->startOfDay();

        return [
            'summary' => [
                'pending' => $items->where('status', ApprovalRequestStatus::Pending)->count(),
                'overdue' => $items->where('status', ApprovalRequestStatus::Pending)->filter(fn (ApprovalRequest $item) => $item->created_at && $item->created_at->lt(now()->subDays(2)))->count(),
                'approved_today' => $items->where('status', ApprovalRequestStatus::Approved)->filter(fn (ApprovalRequest $item) => $item->reviewed_at && $item->reviewed_at->gte($today))->count(),
                'rejected_today' => $items->where('status', ApprovalRequestStatus::Rejected)->filter(fn (ApprovalRequest $item) => $item->reviewed_at && $item->reviewed_at->gte($today))->count(),
            ],
            'items' => $items->map(fn (ApprovalRequest $item, int $index) => [
                'id' => $item->id ?: $index + 1,
                'type' => (string) $item->type,
                'title' => $item->title,
                'requester_name' => $item->requestedBy?->name,
                'branch_name' => null,
                'submitted_at' => $item->created_at?->toIso8601String(),
                'due_at' => $item->created_at?->copy()->addDays(2)->toIso8601String(),
                'status' => $item->status?->value ?? $item->status,
                'priority' => $item->is_urgent ? 'high' : 'medium',
                'summary' => $item->description,
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function enterpriseApprovalsMobile(int $tenantId): array
    {
        $inbox = $this->approvalsInbox($tenantId);

        return [
            'summary' => [
                'pending' => $inbox['summary']['pending'],
                'urgent' => collect($inbox['items'])->where('priority', 'high')->count(),
                'approved_today' => $inbox['summary']['approved_today'],
                'rejected_today' => $inbox['summary']['rejected_today'],
            ],
            'queue' => collect($inbox['items'])->map(fn (array $row) => [
                'id' => $row['id'],
                'type' => $row['type'],
                'title' => $row['title'],
                'requested_by' => $row['requester_name'] ?? 'Unknown',
                'amount_cents' => null,
                'submitted_at' => $row['submitted_at'],
                'priority' => $row['priority'],
                'status' => $row['status'],
                'branch_name' => $row['branch_name'],
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function whiteLabelSettings(WhiteLabelSetting $setting): array
    {
        $theme = is_array($setting->mobile_theme) ? $setting->mobile_theme : [];
        $domains = is_array($setting->custom_domains) ? $setting->custom_domains : [];

        return [
            'custom_domain' => $domains[0] ?? null,
            'app_name' => (string) ($setting->app_name ?? 'Schedelux'),
            'support_email' => $theme['support_email'] ?? null,
            'logo_url' => $theme['logo_url'] ?? null,
            'favicon_url' => $theme['favicon_url'] ?? null,
            'login_background_url' => $theme['login_background_url'] ?? null,
            'primary_color' => (string) ($theme['primary_color'] ?? '#111827'),
            'accent_color' => (string) ($theme['accent_color'] ?? '#ec4899'),
            'email_from_name' => $theme['email_from_name'] ?? null,
            'email_from_address' => $theme['email_from_address'] ?? null,
            'custom_help_url' => $theme['custom_help_url'] ?? null,
            'hide_beautyos_branding' => (bool) ($setting->is_enabled ?? false),
            'dns_status' => empty($domains) ? 'unverified' : 'verifying',
            'updated_at' => $setting->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public function whiteLabelPreview(WhiteLabelSetting $setting): array
    {
        $theme = is_array($setting->mobile_theme) ? $setting->mobile_theme : [];
        $domains = is_array($setting->custom_domains) ? $setting->custom_domains : [];

        return [
            'app_name' => (string) ($setting->app_name ?? 'Schedelux'),
            'plan' => (string) ($setting->plan_required ?? 'enterprise'),
            'primary_hex' => (string) ($theme['primary_color'] ?? '#111827'),
            'accent_hex' => (string) ($theme['accent_color'] ?? '#ec4899'),
            'custom_domain' => $domains[0] ?? null,
            'assets' => [
                'logo' => ! empty($theme['logo_url']),
                'splash' => ! empty($theme['login_background_url']),
                'icon' => ! empty($theme['favicon_url']),
            ],
            'modules' => ['bookings', 'pos', 'staff', 'analytics'],
        ];
    }

    /** @return array<string, mixed> */
    public function branchComparisonAnalytics(int $tenantId): array
    {
        $filters = new ReportFilters(
            tenantId: $tenantId,
            from: now()->subDays(30)->startOfDay(),
            to: now()->endOfDay(),
        );

        $payload = $this->branchComparison->compare($filters);
        $branches = collect($payload['locations'] ?? [])->map(function (array $row) {
            $metrics = $row['metrics'] ?? [];
            $location = $row['location'] ?? [];

            return [
                'branch_id' => (int) ($location['id'] ?? 0),
                'branch_name' => (string) ($location['name'] ?? 'Branch'),
                'revenue_cents' => (int) ($metrics['revenue_cents'] ?? 0),
                'bookings' => (int) ($metrics['bookings_count'] ?? 0),
                'average_ticket_cents' => (int) (($metrics['bookings_count'] ?? 0) > 0
                    ? round(($metrics['revenue_cents'] ?? 0) / max(1, $metrics['bookings_count']))
                    : 0),
                'utilization_percent' => (float) min(100, (($metrics['completed_bookings_count'] ?? 0) / max(1, $metrics['bookings_count'] ?? 1)) * 100),
                'repeat_rate_percent' => 0,
                'review_score' => null,
            ];
        })->values();

        $totalRevenue = (int) $branches->sum('revenue_cents');
        $totalBookings = (int) $branches->sum('bookings');
        $top = $branches->sortByDesc('revenue_cents')->first();

        return [
            'summary' => [
                'branches_compared' => $branches->count(),
                'total_revenue_cents' => $totalRevenue,
                'total_bookings' => $totalBookings,
                'average_utilization_percent' => $branches->count() > 0
                    ? round($branches->avg('utilization_percent'), 1)
                    : 0,
                'top_branch_name' => is_array($top) ? ($top['branch_name'] ?? null) : null,
            ],
            'branches' => $branches->all(),
            'trend' => $branches->flatMap(function (array $branch) {
                return collect(range(0, 4))->map(fn (int $week) => [
                    'label' => 'W'.$week,
                    'branch_name' => $branch['branch_name'],
                    'revenue_cents' => (int) round($branch['revenue_cents'] / 4),
                    'bookings' => (int) max(1, round($branch['bookings'] / 4)),
                    'utilization_percent' => (float) $branch['utilization_percent'],
                ]);
            })->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function formatAbandonedQueueItem(AbandonedBookingSession $session, int $id): array
    {
        $draft = is_array($session->draft) ? $session->draft : [];

        return [
            'id' => $session->id ?: $id,
            'client_name' => $session->client_name ?? 'Guest',
            'service_name' => $draft['service_name'] ?? null,
            'branch_name' => $draft['branch_name'] ?? null,
            'abandoned_at' => $session->last_activity_at?->toIso8601String(),
            'reminder_at' => $session->last_reminder_at?->toIso8601String(),
            'status' => $session->status?->value ?? $session->status,
            'estimated_value_cents' => (int) ($draft['estimated_value_cents'] ?? 0),
        ];
    }
}
