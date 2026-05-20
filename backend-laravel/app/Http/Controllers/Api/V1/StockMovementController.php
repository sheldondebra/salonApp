<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementResource;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\Product::class);

        $query = StockMovement::query()
            ->with(['product', 'location', 'user'])
            ->orderByDesc('created_at');

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->integer('location_id'));
        }

        if ($type = $request->string('type')->trim()->toString()) {
            $query->where('type', $type);
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return StockMovementResource::collection($paginated)->response();
    }
}
