<?php

namespace Database\Seeders;

use App\Models\SmsPackage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SmsPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            ['name' => 'Starter SMS Pack', 'sms_credits' => 500, 'price_cents' => 5000, 'sort_order' => 10],
            ['name' => 'Growth SMS Pack', 'sms_credits' => 2000, 'price_cents' => 18000, 'bonus_credits' => 100, 'sort_order' => 20],
            ['name' => 'Business SMS Pack', 'sms_credits' => 5000, 'price_cents' => 40000, 'bonus_credits' => 300, 'sort_order' => 30],
            ['name' => 'Pro SMS Pack', 'sms_credits' => 10000, 'price_cents' => 75000, 'bonus_credits' => 750, 'sort_order' => 40],
            ['name' => 'Enterprise SMS Pack', 'sms_credits' => 50000, 'price_cents' => 350000, 'bonus_credits' => 5000, 'sort_order' => 50],
        ];

        foreach ($packages as $row) {
            $slug = Str::slug($row['name']);

            $package = SmsPackage::query()->firstOrNew(['slug' => $slug]);
            $package->fill([
                'name' => $row['name'],
                'sms_credits' => $row['sms_credits'],
                'bonus_credits' => $row['bonus_credits'] ?? 0,
                'price_cents' => $row['price_cents'],
                'currency' => 'GHS',
                'validity_days' => 365,
                'description' => "{$row['name']} — {$row['sms_credits']} SMS credits for your salon.",
                'sort_order' => $row['sort_order'],
            ]);
            $package->save();
        }
    }
}
