<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SmsPackageResource;
use App\Models\SmsPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SmsPackageAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SmsPackage::query()->orderBy('sort_order')->orderBy('name');

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        return response()->json([
            'data' => SmsPackageResource::collection($query->get()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        unset($data['is_active']);

        $package = SmsPackage::query()->create($data);

        return response()->json(['data' => new SmsPackageResource($package)], 201);
    }

    public function update(Request $request, SmsPackage $smsPackage): JsonResponse
    {
        $data = $this->validated($request, $smsPackage->id);
        $isActive = array_key_exists('is_active', $data) ? (bool) $data['is_active'] : null;
        unset($data['is_active']);

        if ($data !== []) {
            $smsPackage->update($data);
        }

        if ($isActive !== null) {
            DB::table('sms_packages')
                ->where('id', $smsPackage->id)
                ->update(['is_active' => DB::raw($isActive ? 'true' : 'false')]);
        }

        return response()->json(['data' => new SmsPackageResource($smsPackage->fresh())]);
    }

    public function destroy(SmsPackage $smsPackage): JsonResponse
    {
        $smsPackage->delete();

        return response()->json(['message' => 'SMS package removed.']);
    }

    /** @return array<string, mixed> */
    protected function validated(Request $request, ?int $ignoreId = null): array
    {
        $slugRule = ['required', 'string', 'max:80', 'alpha_dash'];
        $slugRule[] = $ignoreId
            ? Rule::unique('sms_packages', 'slug')->ignore($ignoreId)
            : Rule::unique('sms_packages', 'slug');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => $ignoreId ? ['sometimes', ...$slugRule] : $slugRule,
            'sms_credits' => ['required', 'integer', 'min:1'],
            'bonus_credits' => ['sometimes', 'integer', 'min:0'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'validity_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'description' => ['nullable', 'string', 'max:5000'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (! $ignoreId && empty($data['slug']) && ! empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        if ($request->isMethod('post') && ! isset($data['currency'])) {
            $data['currency'] = 'GHS';
        }

        return $data;
    }
}
