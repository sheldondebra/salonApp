<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Adjustment = 'adjustment';
    case Initial = 'initial';
    case Purchase = 'purchase';
    case Sale = 'sale';
    case Correction = 'correction';
    case Damage = 'damage';
    case Loss = 'loss';
}
