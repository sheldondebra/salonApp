<?php

namespace App\Support;

use Illuminate\Support\Str;

class PaymentReferenceGenerator
{
    public function generate(string $prefix = 'preq'): string
    {
        return $prefix.'_'.Str::uuid();
    }
}
