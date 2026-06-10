<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MarketingIntegrationProvider;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Services\MarketingIntegrationService;
use App\Services\MarketplaceProfileService;
use App\Services\WhiteLabelService;
use App\Services\WorkspaceDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceDashboardController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly WorkspaceDashboardService $dashboards,
        private readonly MarketplaceProfileService $marketplaceProfiles,
        private readonly WhiteLabelService $whiteLabel,
        private readonly MarketingIntegrationService $marketing,
    ) {}

    private function isMobileClient(Request $request): bool
    {
        return $request->header('X-BeautyOS-Client') === 'mobile';
    }

    public function abandonedBookings(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $status = $request->string('status')->toString() ?: null;

        if ($request->string('format')->toString() === 'sessions') {
            return app(AbandonedBookingController::class)->index($request, $tenantSlug);
        }

        $payload = $this->isMobileClient($request)
            ? $this->dashboards->abandonedBookingsMobile($tenant->id, $status)
            : $this->dashboards->abandonedBookingsOverview($tenant->id, $status);

        return response()->json($payload);
    }

    public function rebooking(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $payload = $this->isMobileClient($request)
            ? $this->dashboards->rebookingMobile($tenant->id)
            : $this->dashboards->rebookingOverview($tenant->id);

        return response()->json($payload);
    }

    public function socialLinks(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $payload = $this->isMobileClient($request)
            ? $this->dashboards->socialLinksMobile($tenant->id)
            : $this->dashboards->socialLinksOverview($tenant->id, $tenant);

        return response()->json($payload);
    }

    public function integrationsSettings(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json($this->dashboards->integrationsSettings($tenant->id));
    }

    public function marketplaceProfile(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $profile = $this->marketplaceProfiles->forTenant($tenant->id);
        $profile->loadMissing(['tenantModel.services.category', 'tenantModel.locations']);

        $payload = $this->isMobileClient($request)
            ? $this->dashboards->marketplaceMobileProfile($profile, $tenant)
            : $this->dashboards->marketplaceWorkspaceProfile($profile, $tenant);

        return response()->json($payload);
    }

    public function marketplaceFeatured(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json($this->dashboards->marketplaceFeaturedOverview($tenant->id, $tenant));
    }

    public function marketplaceCommissions(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json($this->dashboards->marketplaceCommissionsOverview($tenant->id));
    }

    public function branchGroups(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json($this->dashboards->branchGroupsOverview($tenant->id));
    }

    public function chairRentals(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $payload = $this->isMobileClient($request)
            ? $this->dashboards->chairRentalsMobile($tenant->id)
            : $this->dashboards->chairRentalsOverview($tenant->id);

        return response()->json($payload);
    }

    public function approvals(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $payload = $this->isMobileClient($request)
            ? $this->dashboards->enterpriseApprovalsMobile($tenant->id)
            : $this->dashboards->approvalsInbox($tenant->id);

        return response()->json($payload);
    }

    public function resolveApproval(Request $request, string $tenantSlug, string $approvalRequest): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $approval = ApprovalRequest::query()
            ->where('tenant_id', $tenant->id)
            ->where(function ($query) use ($approvalRequest) {
                $query->where('uuid', $approvalRequest);
                if (is_numeric($approvalRequest)) {
                    $query->orWhere('id', (int) $approvalRequest);
                }
            })
            ->firstOrFail();

        $data = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $request->merge(['review_note' => $data['notes'] ?? null]);
        $controller = app(ApprovalRequestController::class);

        return $data['decision'] === 'approved'
            ? $controller->approve($request, $tenantSlug, $approval)
            : $controller->reject($request, $tenantSlug, $approval);
    }

    public function whiteLabelSettings(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $settings = $this->whiteLabel->forTenant($tenant->id);

        return response()->json($this->dashboards->whiteLabelSettings($settings));
    }

    public function whiteLabelPreview(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $settings = $this->whiteLabel->forTenant($tenant->id);

        return response()->json($this->dashboards->whiteLabelPreview($settings));
    }

    public function branchComparison(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json($this->dashboards->branchComparisonAnalytics($tenant->id));
    }

    public function updateIntegrationsSettings(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'ga_measurement_id' => ['nullable', 'string', 'max:128'],
            'meta_pixel_id' => ['nullable', 'string', 'max:128'],
            'ga_enabled' => ['sometimes', 'boolean'],
            'meta_enabled' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('ga_measurement_id', $data) || array_key_exists('ga_enabled', $data)) {
            $this->marketing->updateIntegration($tenant->id, MarketingIntegrationProvider::GoogleAnalytics, [
                'is_active' => $data['ga_enabled'] ?? ! empty($data['ga_measurement_id']),
                'config' => ['measurement_id' => $data['ga_measurement_id'] ?? null],
            ]);
        }

        if (array_key_exists('meta_pixel_id', $data) || array_key_exists('meta_enabled', $data)) {
            $this->marketing->updateIntegration($tenant->id, MarketingIntegrationProvider::MetaPixel, [
                'is_active' => $data['meta_enabled'] ?? ! empty($data['meta_pixel_id']),
                'config' => ['pixel_id' => $data['meta_pixel_id'] ?? null],
            ]);
        }

        return response()->json($this->dashboards->integrationsSettings($tenant->id));
    }

    public function updateWhiteLabelSettings(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'custom_domain' => ['nullable', 'string', 'max:255'],
            'app_name' => ['nullable', 'string', 'max:255'],
            'support_email' => ['nullable', 'email', 'max:255'],
            'logo_url' => ['nullable', 'string', 'max:2048'],
            'favicon_url' => ['nullable', 'string', 'max:2048'],
            'login_background_url' => ['nullable', 'string', 'max:2048'],
            'primary_color' => ['nullable', 'string', 'max:32'],
            'accent_color' => ['nullable', 'string', 'max:32'],
            'email_from_name' => ['nullable', 'string', 'max:255'],
            'email_from_address' => ['nullable', 'email', 'max:255'],
            'custom_help_url' => ['nullable', 'string', 'max:2048'],
            'hide_beautyos_branding' => ['sometimes', 'boolean'],
        ]);

        $existing = $this->whiteLabel->forTenant($tenant->id);
        $theme = is_array($existing->mobile_theme) ? $existing->mobile_theme : [];
        $domains = is_array($existing->custom_domains) ? $existing->custom_domains : [];

        if (array_key_exists('custom_domain', $data)) {
            $domains = $data['custom_domain'] ? [$data['custom_domain']] : [];
        }

        $settings = $this->whiteLabel->update($tenant->id, [
            'app_name' => $data['app_name'] ?? $existing->app_name,
            'is_enabled' => $data['hide_beautyos_branding'] ?? $existing->is_enabled,
            'custom_domains' => $domains,
            'mobile_theme' => array_merge($theme, array_filter([
                'support_email' => $data['support_email'] ?? null,
                'logo_url' => $data['logo_url'] ?? null,
                'favicon_url' => $data['favicon_url'] ?? null,
                'login_background_url' => $data['login_background_url'] ?? null,
                'primary_color' => $data['primary_color'] ?? null,
                'accent_color' => $data['accent_color'] ?? null,
                'email_from_name' => $data['email_from_name'] ?? null,
                'email_from_address' => $data['email_from_address'] ?? null,
                'custom_help_url' => $data['custom_help_url'] ?? null,
            ], fn ($value) => $value !== null)),
        ]);

        return response()->json($this->dashboards->whiteLabelSettings($settings));
    }
}
