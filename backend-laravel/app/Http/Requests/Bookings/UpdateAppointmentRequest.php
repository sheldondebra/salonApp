<?php

namespace App\Http\Requests\Bookings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', Rule::in(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'])],
            'starts_at' => ['sometimes', 'date', 'after:now'],
            'staff_member_id' => ['sometimes', 'nullable', 'integer', 'exists:staff_members,id'],
            'location_id' => ['sometimes', 'nullable', 'integer', 'exists:locations,id'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
