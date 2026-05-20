<?php

namespace App\Http\Resources;

use App\Support\UserAgentParser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'user_type' => $this->user_type?->value ?? $this->user_type,
            'account_intent' => $this->account_intent,
            'onboarding_status' => $this->onboarding_status?->value ?? $this->onboarding_status,
            'selected_plan' => $this->selected_plan,
            'is_active' => (bool) $this->is_active,
            'is_blocked' => (bool) $this->is_blocked,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'email_verified' => $this->email_verified_at !== null,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'last_login_ip' => $this->last_login_ip,
            'last_login_device' => UserAgentParser::deviceLabel($this->last_login_user_agent),
            'created_at' => $this->created_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'tenants' => $this->whenLoaded('tenants', fn () => $this->tenants->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'plan' => $t->plan,
                'status' => $t->status?->value ?? $t->status,
                'is_owner' => (bool) $t->pivot->is_owner,
                'joined_at' => $t->pivot->joined_at,
            ])),
            'tenants_count' => $this->whenCounted('tenants'),
            'login_logs' => $this->whenLoaded('loginLogs', fn () => $this->loginLogs->map(fn ($log) => [
                'id' => $log->id,
                'ip_address' => $log->ip_address,
                'device_label' => $log->device_label,
                'user_agent' => $log->user_agent,
                'status' => $log->status,
                'failure_reason' => $log->failure_reason,
                'logged_in_at' => $log->logged_in_at?->toIso8601String(),
            ])),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
        ];
    }
}
