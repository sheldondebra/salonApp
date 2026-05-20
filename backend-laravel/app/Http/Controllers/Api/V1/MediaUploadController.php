<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaUploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,gif'],
            'purpose' => ['nullable', 'string', 'in:logo,gallery_before,gallery_after,general'],
        ]);

        $purpose = $validated['purpose'] ?? 'general';
        $file = $validated['file'];
        $path = $file->storeAs(
            'uploads/'.date('Y/m'),
            Str::uuid().'.'.$file->getClientOriginalExtension(),
            'public'
        );

        $url = Storage::disk('public')->url($path);

        return response()->json([
            'url' => $url,
            'path' => $path,
            'purpose' => $purpose,
        ]);
    }
}
