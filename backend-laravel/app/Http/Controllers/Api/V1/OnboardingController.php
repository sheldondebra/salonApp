<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OnboardingStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PortfolioGalleryItemResource;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\TenantResource;
use App\Mail\WelcomeOnboardingMail;
use App\Models\User;
use App\Services\BusinessTypeService;
use App\Services\OnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OnboardingController extends Controller
{
    public function __construct(
        protected OnboardingService $onboarding,
    ) {}

    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! in_array($user->onboarding_status, [OnboardingStatus::Paid, OnboardingStatus::Onboarded], true)) {
            return response()->json([
                'message' => 'Onboarding is not available for this account.',
            ], 403);
        }

        $tenant = $user->ownedTenant();
        $catalog = null;

        if ($tenant) {
            $catalog = [
                'services' => ServiceResource::collection(
                    $tenant->services()->with('category')->orderBy('name')->get()
                )->resolve(),
                'gallery' => PortfolioGalleryItemResource::collection(
                    $tenant->portfolioGalleryItems()->orderBy('sort_order')->get()
                )->resolve(),
            ];
        }

        return response()->json([
            'progress' => $this->onboarding->progressForUser($user),
            'onboarding_status' => $user->onboarding_status->value,
            'business_types' => app(BusinessTypeService::class)->listForApi(),
            'catalog' => $catalog,
        ]);
    }

    public function serviceSuggestions(Request $request): JsonResponse
    {
        $raw = $request->input('types');
        $types = is_array($raw)
            ? $raw
            : array_filter(explode(',', (string) $raw));

        if ($types === []) {
            return response()->json(['message' => 'types parameter required'], 422);
        }

        return response()->json([
            'suggestions' => app(BusinessTypeService::class)->suggestedServices($types),
        ]);
    }

    public function updateStep(Request $request, string $step): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            // `present` allows an empty array (review step); `required` rejects [].
            'data' => ['present', 'array'],
            'complete' => ['sometimes', 'boolean'],
        ]);

        try {
            $result = $this->onboarding->saveStep(
                $user,
                $step,
                $data['data'],
                $data['complete'] ?? true,
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }

        $user->refresh();
        $response = [
            'progress' => $result['progress'],
            'onboarding_status' => $user->onboarding_status->value,
        ];

        if (isset($result['tenant'])) {
            $response['tenant'] = new TenantResource($result['tenant']);
        }

        if ($step === 'review' && $user->onboarding_status === OnboardingStatus::Onboarded) {
            $tenant = $user->ownedTenant();
            if ($tenant) {
                try {
                    Mail::to($user->email)->send(new WelcomeOnboardingMail($user, $tenant));
                } catch (\Throwable) {
                    // non-blocking
                }
            }
            $response['redirect'] = '/'.($tenant?->slug ?? '').'/dashboard';
        }

        return response()->json($response);
    }

    /** @deprecated Use PATCH /onboarding/steps/{step} */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:80', 'alpha_dash'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'currency' => ['nullable', 'string', 'size:3'],
            'business_phone' => ['nullable', 'string', 'max:30'],
            'business_email' => ['nullable', 'email', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $this->onboarding->saveStep($user, 'business', [
            'business_name' => $validated['business_name'],
            'slug' => $validated['slug'],
            'timezone' => $validated['timezone'] ?? 'UTC',
            'currency' => $validated['currency'] ?? config('billing.currency', 'USD'),
        ]);

        $user->refresh();
        $tenant = $user->ownedTenant();

        if ($tenant) {
            $this->onboarding->saveStep($user, 'business_type', ['business_type' => 'hair_salon']);
            if (! empty($validated['business_phone']) || ! empty($validated['business_email'])) {
                $this->onboarding->saveStep($user, 'contact', [
                    'business_phone' => $validated['business_phone'] ?? $user->phone,
                    'business_email' => $validated['business_email'] ?? $user->email,
                ]);
            }
            if (! empty($validated['tagline'])) {
                $this->onboarding->saveStep($user, 'branding', ['tagline' => $validated['tagline']]);
            }
            $this->onboarding->saveStep($user, 'location', ['multiple_locations' => false]);
            $result = $this->onboarding->saveStep($user, 'review', [], true);
            $user->refresh();
            $tenant = $user->ownedTenant();

            return response()->json([
                'tenant' => new TenantResource($tenant),
                'progress' => $result['progress'],
                'redirect' => '/'.$tenant->slug.'/dashboard',
                'message' => 'Salon workspace created',
            ], 201);
        }

        return response()->json(['message' => 'Could not create workspace'], 422);
    }
}
