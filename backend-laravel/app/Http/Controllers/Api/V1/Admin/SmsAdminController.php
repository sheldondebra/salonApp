<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SmsMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SmsMessage::query()
            ->with('tenant:id,name,slug')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where('recipient', 'like', "%{$search}%");
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        $summary = [
            'total' => SmsMessage::query()->count(),
            'sent' => SmsMessage::query()->where('status', 'sent')->count(),
            'queued' => SmsMessage::query()->where('status', 'queued')->count(),
            'failed' => SmsMessage::query()->whereIn('status', ['failed', 'error'])->count(),
        ];

        return response()->json(array_merge($paginated->toArray(), ['summary' => $summary]));
    }
}
