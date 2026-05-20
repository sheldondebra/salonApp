<?php

namespace Database\Seeders;

use App\Enums\SmsWalletTransactionType;
use App\Models\SmsProviderBalance;
use App\Models\Tenant;
use App\Services\SmsWalletService;
use Illuminate\Database\Seeder;

class SmsResellerSeeder extends Seeder
{
    public function run(): void
    {
        $walletService = app(SmsWalletService::class);

        SmsProviderBalance::query()->updateOrCreate(
            ['provider' => 'mnotify'],
            [
                'balance_credits' => 0,
                'status' => 'pending_sync',
                'meta' => ['note' => 'Sync from MNotify in Batch 52'],
            ]
        );

        Tenant::query()->each(function (Tenant $tenant) use ($walletService) {
            $wallet = $walletService->walletFor($tenant->id);

            if ($wallet->balance_credits > 0) {
                return;
            }

            $walletService->credit(
                $tenant->id,
                500,
                SmsWalletTransactionType::Allocation,
                'Demo starter SMS credits',
                null,
                'seeder',
                $tenant->id,
            );
        });
    }
}
