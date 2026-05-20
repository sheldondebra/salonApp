<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformPlan extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'price_cents',
        'interval',
        'contact_sales',
        'is_active',
        'sort_order',
        'features',
    ];

    protected function casts(): array
    {
        return [
            'contact_sales' => 'boolean',
            'is_active' => 'boolean',
            'features' => 'array',
        ];
    }

    public function toBillingArray(): array
    {
        return [
            'id' => $this->slug,
            'name' => $this->name,
            'price_cents' => $this->price_cents,
            'interval' => $this->interval,
            'contact_sales' => $this->contact_sales,
        ];
    }

    public static function billingCatalog(): array
    {
        $fromDb = static::query()
            ->whereBool('is_active')
            ->orderBy('sort_order')
            ->get();

        if ($fromDb->isNotEmpty()) {
            return $fromDb->mapWithKeys(fn (PlatformPlan $plan) => [
                $plan->slug => $plan->toBillingArray(),
            ])->all();
        }

        return collect(config('billing.plans', []))
            ->map(fn (array $plan, string $id) => array_merge(['id' => $id], $plan))
            ->all();
    }
}
