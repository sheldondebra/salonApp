<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendBookingRemindersCommand extends Command
{
    protected $signature = 'bookings:send-reminders';

    protected $description = 'Send SMS and email reminders for upcoming appointments';

    public function handle(NotificationService $notifications): int
    {
        $hours = (int) config('notifications.reminders.hours_before', 24);
        $windowStart = now()->addHours($hours)->subHour();
        $windowEnd = now()->addHours($hours)->addHour();

        $appointments = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->with(['service', 'staffMember', 'client', 'tenant'])
            ->whereBetween('starts_at', [$windowStart, $windowEnd])
            ->whereNotIn('status', ['cancelled', 'completed', 'no_show'])
            ->get();

        $sent = 0;

        foreach ($appointments as $appointment) {
            $notifications->bookingReminder($appointment);
            $sent++;
        }

        $this->info("Processed {$sent} appointment reminder(s).");

        return self::SUCCESS;
    }
}
