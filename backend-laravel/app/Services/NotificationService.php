<?php

namespace App\Services;

use App\Enums\SmsNotificationType;
use App\Jobs\SendTransactionalEmailJob;
use App\Mail\BookingCancellationMail;
use App\Mail\BookingConfirmationMail;
use App\Mail\BookingReminderMail;
use App\Mail\OtpMail;
use App\Mail\PaymentAlertMail;
use App\Models\Appointment;
use App\Models\SmsMessage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class NotificationService
{
    public function __construct(
        protected SmsService $sms,
    ) {}

    public function bookingConfirmed(Appointment $appointment): void
    {
        $appointment->loadMissing(['service', 'staffMember', 'client', 'tenant', 'location']);
        $tenant = $appointment->tenant;
        $settings = $tenant?->notificationSettings() ?? [];

        [$email, $phone, $name] = $this->resolveRecipient($appointment);

        if ($email && ($settings['booking_confirmation_email'] ?? true)) {
            $this->queueEmail($email, new BookingConfirmationMail($appointment), $settings);
        }

        if ($phone && ($settings['booking_confirmation_sms'] ?? true) && ($settings['sms_enabled'] ?? true)) {
            $this->sms->queue(
                $phone,
                $this->bookingConfirmationSmsBody($appointment, $name),
                SmsNotificationType::BookingConfirmation,
                $tenant?->id,
                ['appointment_id' => $appointment->id]
            );
        }
    }

    public function bookingCancelled(Appointment $appointment): void
    {
        $appointment->loadMissing(['service', 'staffMember', 'client', 'tenant']);
        $tenant = $appointment->tenant;
        $settings = $tenant?->notificationSettings() ?? [];

        [$email, $phone, $name] = $this->resolveRecipient($appointment);

        if ($email && ($settings['booking_cancellation_email'] ?? true)) {
            $this->queueEmail($email, new BookingCancellationMail($appointment), $settings);
        }

        if ($phone && ($settings['booking_cancellation_sms'] ?? true) && ($settings['sms_enabled'] ?? true)) {
            $this->sms->queue(
                $phone,
                "Hi {$name}, your appointment at {$tenant?->name} on ".$appointment->starts_at->format('M j, g:i A').' has been cancelled.',
                SmsNotificationType::BookingCancellation,
                $tenant?->id,
                ['appointment_id' => $appointment->id]
            );
        }
    }

    public function bookingReminder(Appointment $appointment): void
    {
        if ($this->reminderAlreadySent($appointment)) {
            return;
        }

        $appointment->loadMissing(['service', 'staffMember', 'client', 'tenant']);
        $tenant = $appointment->tenant;
        $settings = $tenant?->notificationSettings() ?? [];

        [$email, $phone, $name] = $this->resolveRecipient($appointment);

        if ($email && ($settings['booking_reminder_email'] ?? true)) {
            $this->queueEmail($email, new BookingReminderMail($appointment), $settings);
        }

        if ($phone && ($settings['booking_reminder_sms'] ?? true) && ($settings['sms_enabled'] ?? true)) {
            $this->sms->queue(
                $phone,
                "Reminder: {$name}, you have an appointment at {$tenant?->name} tomorrow at ".$appointment->starts_at->format('g:i A').'.',
                SmsNotificationType::BookingReminder,
                $tenant?->id,
                ['appointment_id' => $appointment->id]
            );
        }

        $this->markReminderSent($appointment);
    }

    public function paymentAlert(Appointment $appointment, int $amountCents, string $currency): void
    {
        $appointment->loadMissing(['service', 'tenant', 'client']);
        $tenant = $appointment->tenant;
        $settings = $tenant?->notificationSettings() ?? [];

        [$email, $phone, $name] = $this->resolveRecipient($appointment);
        $amount = number_format($amountCents / 100, 2).' '.$currency;

        if ($email && ($settings['payment_alert_email'] ?? true)) {
            $this->queueEmail($email, new PaymentAlertMail($appointment, $amountCents, $currency), $settings);
        }

        if ($phone && ($settings['payment_alert_sms'] ?? true) && ($settings['sms_enabled'] ?? true)) {
            $this->sms->queue(
                $phone,
                "Hi {$name}, we received your payment of {$amount} for {$appointment->service?->name} at {$tenant?->name}. Thank you!",
                SmsNotificationType::PaymentAlert,
                $tenant?->id,
                ['appointment_id' => $appointment->id]
            );
        }
    }

    /**
     * @return array{0: string, 1: string} [code, cache_key]
     */
    public function sendOtp(string $phone, ?string $email = null, ?int $tenantId = null): array
    {
        $length = (int) config('notifications.otp.length', 6);
        $code = str_pad((string) random_int(0, 10 ** $length - 1), $length, '0', STR_PAD_LEFT);
        $cacheKey = config('notifications.otp.cache_prefix').hash('sha256', $phone.($email ?? ''));

        Cache::put($cacheKey, $code, now()->addMinutes((int) config('notifications.otp.expires_minutes', 10)));

        $message = "Your SalonApp verification code is {$code}. It expires in 10 minutes.";

        $this->sms->queue($phone, $message, SmsNotificationType::Otp, $tenantId, ['purpose' => 'otp']);

        if ($email) {
            $this->queueEmail($email, new OtpMail($code), ['email_enabled' => true]);
        }

        return [$code, $cacheKey];
    }

    public function verifyOtp(string $phone, string $code, ?string $email = null): bool
    {
        $cacheKey = config('notifications.otp.cache_prefix').hash('sha256', $phone.($email ?? ''));
        $expected = Cache::get($cacheKey);

        if (! $expected || ! hash_equals((string) $expected, trim($code))) {
            return false;
        }

        Cache::forget($cacheKey);

        return true;
    }

    /**
     * Marketing SMS foundation — respects tenant opt-in; logs for admin review.
     *
     * @param  list<string>  $recipients
     */
    public function queueMarketing(Tenant $tenant, array $recipients, string $message): int
    {
        $settings = $tenant->notificationSettings();

        if (! ($settings['marketing_sms_enabled'] ?? false) || ! ($settings['sms_enabled'] ?? true)) {
            return 0;
        }

        $count = 0;
        foreach ($recipients as $to) {
            if (! filled($to)) {
                continue;
            }
            $this->sms->queue($to, $message, SmsNotificationType::Marketing, $tenant->id, [
                'campaign' => Str::slug($tenant->slug.'-'.now()->format('Ymd')),
            ]);
            $count++;
        }

        return $count;
    }

    protected function queueEmail(string $to, $mailable, array $settings = []): void
    {
        if ($settings !== [] && ! ($settings['email_enabled'] ?? true)) {
            return;
        }

        SendTransactionalEmailJob::dispatch($to, $mailable);
    }

    /**
     * @return array{0: ?string, 1: ?string, 2: string} email, phone, name
     */
    protected function resolveRecipient(Appointment $appointment): array
    {
        $client = $appointment->client;
        $name = $client?->name ?? 'there';
        $email = $client?->email;
        $phone = $client?->phone;

        return [$email, $phone, $name];
    }

    protected function bookingConfirmationSmsBody(Appointment $appointment, string $name): string
    {
        $tenant = $appointment->tenant?->name ?? 'the salon';
        $when = $appointment->starts_at->format('M j, g:i A');
        $service = $appointment->service?->name ?? 'your appointment';

        return "Hi {$name}, you're booked for {$service} at {$tenant} on {$when}. See you soon!";
    }

    protected function reminderAlreadySent(Appointment $appointment): bool
    {
        if (Cache::has($this->reminderCacheKey($appointment->id))) {
            return true;
        }

        return SmsMessage::query()
            ->where('type', SmsNotificationType::BookingReminder->value)
            ->whereIn('status', ['sent', 'queued'])
            ->where('meta->appointment_id', $appointment->id)
            ->exists();
    }

    protected function markReminderSent(Appointment $appointment): void
    {
        $ttl = $appointment->starts_at?->addDay() ?? now()->addDays(7);

        Cache::put($this->reminderCacheKey($appointment->id), true, $ttl);
    }

    protected function reminderCacheKey(int $appointmentId): string
    {
        return 'booking_reminder_sent:'.$appointmentId;
    }
}
