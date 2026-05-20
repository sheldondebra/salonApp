<?php

namespace App\Services;

use App\Enums\UserType;
use App\Mail\AdminPasswordResetMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminUserPasswordService
{
    public function sendResetLink(User $target, User $actor): void
    {
        $this->guardTarget($target, $actor);

        $status = Password::broker('users')->sendResetLink(['email' => $target->email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }

    /**
     * Generate a temporary password, save it, and email the user.
     *
     * @return string Plain-text password (for admin confirmation UI only — not logged)
     */
    public function resetAndNotify(User $target, User $actor): string
    {
        $this->guardTarget($target, $actor);

        $plain = Str::password(14);

        $target->forceFill([
            'password' => Hash::make($plain),
        ])->save();

        $target->tokens()->delete();

        Mail::to($target->email)->send(new AdminPasswordResetMail($target, $plain));

        return $plain;
    }

    protected function guardTarget(User $target, User $actor): void
    {
        if ($target->user_type === UserType::Client) {
            abort(404);
        }

        if ($target->user_type === UserType::SuperAdmin && ! $actor->isSuperAdmin()) {
            abort(403, 'Only Super Admin can reset this account.');
        }

        if ($target->is($actor)) {
            abort(422, 'Use your profile settings or forgot-password flow for your own account.');
        }
    }
}
