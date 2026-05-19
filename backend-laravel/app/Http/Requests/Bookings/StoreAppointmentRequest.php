<?php

namespace App\Http\Requests\Bookings;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'starts_at' => ['required', 'date'],
            'client_name' => ['required_without:client_user_id', 'string', 'max:255'],
            'client_email' => ['required_without:client_user_id', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
