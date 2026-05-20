<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SupportAdminController extends Controller
{
    /**
     * Placeholder until the support module ships.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [],
            'meta' => [
                'total' => 0,
                'current_page' => 1,
                'last_page' => 1,
            ],
            'message' => 'Support tickets module is not enabled yet. This view is reserved for future releases.',
        ]);
    }
}
