<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    protected function resetUrl($notifiable): string
    {
        $frontend = rtrim(config('billing.frontend_url', 'http://localhost:3000'), '/');
        $email = urlencode($notifiable->getEmailForPasswordReset());

        return "{$frontend}/reset-password?token={$this->token}&email={$email}";
    }

    public function toMail($notifiable): MailMessage
    {
        $expire = config('auth.passwords.users.expire', 60);

        return (new MailMessage)
            ->subject('Reset your SalonApp password')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset password', $this->resetUrl($notifiable))
            ->line("This link expires in {$expire} minutes.")
            ->line('If you did not request a reset, you can ignore this email.');
    }
}
