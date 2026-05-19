<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'phone' => ['nullable', 'string', 'max:30'],
            'marketing_opt_in' => ['boolean'],
            'account_intent' => ['nullable', Rule::in(['client', 'salon_owner'])],
            'plan' => ['nullable', 'string', Rule::in(array_keys(config('billing.plans', [])))],
        ];
    }
}
