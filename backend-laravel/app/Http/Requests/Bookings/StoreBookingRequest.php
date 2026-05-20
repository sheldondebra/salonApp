<?php

namespace App\Http\Requests\Bookings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('service_id') && ! $this->filled('service_ids')) {
            $this->merge(['service_ids' => [(int) $this->input('service_id')]]);
        }
    }

    public function rules(): array
    {
        $maxParty = config('booking.max_party_size', 10);
        $maxRecurring = config('booking.max_recurring_occurrences', 12);

        return [
            'service_id' => ['sometimes', 'integer', 'exists:services,id'],
            'service_ids' => ['required_without:service_id', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'starts_at' => ['required', 'date', 'after:now'],
            'party_size' => ['nullable', 'integer', 'min:1', 'max:'.$maxParty],
            'recurrence' => ['nullable', 'array'],
            'recurrence.frequency' => ['nullable', Rule::in(['weekly', 'biweekly', 'monthly'])],
            'recurrence.occurrences' => ['nullable', 'integer', 'min:2', 'max:'.$maxRecurring],
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'client_name' => ['required_without:client_user_id', 'string', 'max:255'],
            'client_email' => ['required_without:client_user_id', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
