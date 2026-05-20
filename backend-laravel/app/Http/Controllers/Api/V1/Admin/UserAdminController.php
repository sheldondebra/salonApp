<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()
            ->visibleToPlatformAdmin()
            ->with(['tenants:id,name,slug,plan,status'])
            ->withCount('tenants')
            ->orderByDesc('created_at');

        if ($request->boolean('include_deleted')) {
            $query->withTrashed();
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('user_type')) {
            $query->where('user_type', $request->string('user_type')->toString());
        }

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('is_blocked')) {
            $query->whereBool('is_blocked', $request->boolean('is_blocked'));
        }

        if ($request->filled('email_verified')) {
            $request->boolean('email_verified')
                ? $query->whereNotNull('email_verified_at')
                : $query->whereNull('email_verified_at');
        }

        $users = $query->paginate(min($request->integer('per_page', 20), 50));

        return response()->json([
            'data' => AdminUserResource::collection($users->getCollection()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        $user->load([
            'tenants:id,name,slug,plan,status',
            'loginLogs' => fn ($q) => $q->limit(50),
            'roles',
        ]);

        return response()->json([
            'data' => new AdminUserResource($user),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $actor = $request->user();
        $validated = $request->validate([
            'is_active' => ['sometimes', 'boolean'],
            'is_blocked' => ['sometimes', 'boolean'],
            'user_type' => ['sometimes', Rule::enum(UserType::class)],
            'verify_email' => ['sometimes', 'boolean'],
            'restore' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['user_type']) && $validated['user_type'] === UserType::SuperAdmin->value) {
            abort_unless($actor->isSuperAdmin(), 403, 'Only Super Admin can assign Super Admin role.');
        }

        if ($user->is($actor)) {
            if (isset($validated['is_active']) && ! $validated['is_active']) {
                abort(422, 'You cannot deactivate your own account.');
            }
            if (isset($validated['is_blocked']) && $validated['is_blocked']) {
                abort(422, 'You cannot block your own account.');
            }
        }

        if (! empty($validated['restore']) && $user->trashed()) {
            $user->restore();
        }

        if (array_key_exists('verify_email', $validated) && $validated['verify_email']) {
            $user->email_verified_at = now();
        }

        $updates = collect($validated)->only(['is_active', 'is_blocked', 'user_type'])->all();
        if ($updates !== []) {
            $user->update($updates);
        } elseif (array_key_exists('verify_email', $validated) && $validated['verify_email']) {
            $user->save();
        }

        $user->load(['tenants:id,name,slug,plan,status', 'loginLogs' => fn ($q) => $q->limit(50), 'roles']);

        return response()->json([
            'data' => new AdminUserResource($user->fresh()),
            'message' => 'User updated',
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        if ($user->is($request->user())) {
            abort(422, 'You cannot delete your own account.');
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'User removed (soft delete).',
        ]);
    }
}
