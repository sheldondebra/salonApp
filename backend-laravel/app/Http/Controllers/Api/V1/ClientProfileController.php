<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ClientAllergy;
use App\Models\ClientDocument;
use App\Models\ClientMedia;
use App\Models\ClientNote;
use App\Models\ClientPatchTest;
use App\Models\ClientTreatment;
use App\Models\User;
use App\Services\ClientProfileService;
use App\Support\PermissionChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientProfileController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(private readonly ClientProfileService $profiles) {}

    public function show(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.view');
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json([
            'data' => $this->profiles->show($tenant->id, $client),
        ]);
    }

    public function update(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);

        $validated = $request->validate([
            'preferred_staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'preferred_contact' => ['nullable', 'string', 'max:32'],
            'sms_reminders' => ['sometimes', 'boolean'],
            'email_marketing' => ['sometimes', 'boolean'],
            'sms_marketing' => ['sometimes', 'boolean'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:64'],
        ]);

        $profile = $this->profiles->updateProfile($tenant->id, $client, $validated);

        return response()->json([
            'data' => [
                'preferred_staff_member_id' => $profile->preferred_staff_member_id,
                'preferred_staff_name' => $profile->preferredStaffMember?->display_name,
                'preferred_contact' => $profile->preferred_contact,
                'sms_reminders' => (bool) $profile->sms_reminders,
                'email_marketing' => (bool) $profile->email_marketing,
                'sms_marketing' => (bool) $profile->sms_marketing,
                'tags' => $profile->tags ?? [],
            ],
        ]);
    }

    public function storeNote(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        $this->profiles->assertClientForTenant($client, $tenant->id);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);

        $note = ClientNote::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $client->id,
            'author_user_id' => $request->user()?->id,
            'body' => $validated['body'],
            'is_pinned' => $validated['is_pinned'] ?? false,
        ]);

        return response()->json(['data' => $note->load('author:id,name')], 201);
    }

    public function destroyNote(Request $request, string $tenantSlug, User $client, ClientNote $note): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($note->user_id === $client->id && $note->tenant_id === $tenant->id, 404);
        $note->delete();

        return response()->json(['message' => 'Note removed.']);
    }

    public function storeAllergy(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        $this->profiles->assertClientForTenant($client, $tenant->id);

        $validated = $request->validate([
            'allergen' => ['required', 'string', 'max:255'],
            'severity' => ['sometimes', 'string', 'max:32'],
            'reaction_notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $row = ClientAllergy::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $client->id,
            ...$validated,
        ]);

        return response()->json(['data' => $row], 201);
    }

    public function destroyAllergy(Request $request, string $tenantSlug, User $client, ClientAllergy $allergy): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($allergy->user_id === $client->id && $allergy->tenant_id === $tenant->id, 404);
        $allergy->delete();

        return response()->json(['message' => 'Allergy removed.']);
    }

    public function storePatchTest(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        $this->profiles->assertClientForTenant($client, $tenant->id);

        $validated = $request->validate([
            'product_name' => ['required', 'string', 'max:255'],
            'tested_on' => ['required', 'date'],
            'expires_on' => ['nullable', 'date'],
            'result' => ['sometimes', 'string', 'max:32'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
        ]);

        $row = ClientPatchTest::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $client->id,
            ...$validated,
        ]);

        return response()->json(['data' => $row->load('staffMember:id,display_name')], 201);
    }

    public function destroyPatchTest(Request $request, string $tenantSlug, User $client, ClientPatchTest $patchTest): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($patchTest->user_id === $client->id && $patchTest->tenant_id === $tenant->id, 404);
        $patchTest->delete();

        return response()->json(['message' => 'Patch test removed.']);
    }

    public function storeTreatment(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        $this->profiles->assertClientForTenant($client, $tenant->id);

        $validated = $request->validate([
            'service_name' => ['required', 'string', 'max:255'],
            'treated_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'outcome' => ['nullable', 'string', 'max:64'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
        ]);

        $row = ClientTreatment::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $client->id,
            ...$validated,
        ]);

        return response()->json(['data' => $row->load('staffMember:id,display_name')], 201);
    }

    public function destroyTreatment(Request $request, string $tenantSlug, User $client, ClientTreatment $treatment): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($treatment->user_id === $client->id && $treatment->tenant_id === $tenant->id, 404);
        $treatment->delete();

        return response()->json(['message' => 'Treatment removed.']);
    }

    public function storeMedia(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        $this->profiles->assertClientForTenant($client, $tenant->id);

        $validated = $request->validate([
            'kind' => ['required', 'string', 'in:before,after'],
            'url' => ['required', 'string', 'max:2048'],
            'caption' => ['nullable', 'string', 'max:500'],
            'taken_at' => ['nullable', 'date'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
        ]);

        $row = ClientMedia::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $client->id,
            ...$validated,
        ]);

        return response()->json(['data' => $row], 201);
    }

    public function destroyMedia(Request $request, string $tenantSlug, User $client, ClientMedia $medium): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($medium->user_id === $client->id && $medium->tenant_id === $tenant->id, 404);
        $medium->delete();

        return response()->json(['message' => 'Photo removed.']);
    }

    public function storeDocument(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        $this->profiles->assertClientForTenant($client, $tenant->id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'file_url' => ['required', 'string', 'max:2048'],
            'mime_type' => ['nullable', 'string', 'max:128'],
        ]);

        $row = ClientDocument::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $client->id,
            'uploaded_by_user_id' => $request->user()?->id,
            ...$validated,
        ]);

        return response()->json(['data' => $row->load('uploadedBy:id,name')], 201);
    }

    public function destroyDocument(Request $request, string $tenantSlug, User $client, ClientDocument $document): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($document->user_id === $client->id && $document->tenant_id === $tenant->id, 404);
        $document->delete();

        return response()->json(['message' => 'Document removed.']);
    }

    protected function requirePermission(Request $request, string $permission): void
    {
        abort_unless(PermissionChecker::allows($request->user(), $permission), 403);
    }
}
