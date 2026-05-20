<?php

namespace Database\Seeders;

use App\Models\PlatformPlan;
use Illuminate\Database\Seeder;

class PlatformPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            ['slug' => 'starter', 'name' => 'Starter', 'price_cents' => 9900, 'sort_order' => 1],
            ['slug' => 'growth', 'name' => 'Growth', 'price_cents' => 49900, 'sort_order' => 2],
            ['slug' => 'professional', 'name' => 'Professional', 'price_cents' => 129900, 'sort_order' => 3],
            [
                'slug' => 'enterprise',
                'name' => 'Enterprise',
                'price_cents' => 0,
                'contact_sales' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            PlatformPlan::query()->updateOrCreate(
                ['slug' => $plan['slug']],
                array_merge([
                    'interval' => 'month',
                    'is_active' => true,
                    'contact_sales' => false,
                ], $plan)
            );
        }
    }
}
