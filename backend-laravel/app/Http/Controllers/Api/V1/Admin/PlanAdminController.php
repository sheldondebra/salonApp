<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlanAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = PlatformPlan::query()->orderBy('sort_order')->get();

        return response()->json(['data' => $plans]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);

        $plan = PlatformPlan::query()->create($validated);

        return response()->json(['data' => $plan], 201);
    }

    public function update(Request $request, PlatformPlan $plan): JsonResponse
    {
        $validated = $this->validated($request, $plan->id);

        $plan->update($validated);

        return response()->json(['data' => $plan->fresh()]);
    }

    public function destroy(PlatformPlan $plan): JsonResponse
    {
        $plan->delete();

        return response()->json(['message' => 'Plan removed.']);
    }

    /** @return array<string, mixed> */
    protected function validated(Request $request, ?int $ignoreId = null): array
    {
        $slugRule = ['required', 'string', 'max:80', 'alpha_dash'];
        if ($ignoreId) {
            $slugRule[] = 'unique:platform_plans,slug,'.$ignoreId;
        } else {
            $slugRule[] = 'unique:platform_plans,slug';
        }

        $data = $request->validate([
            'slug' => $slugRule,
            'name' => ['required', 'string', 'max:255'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'interval' => ['nullable', 'string', 'max:20'],
            'contact_sales' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
        ]);

        if ($request->isMethod('post') && empty($data['slug']) && ! empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        return $data;
    }
}
