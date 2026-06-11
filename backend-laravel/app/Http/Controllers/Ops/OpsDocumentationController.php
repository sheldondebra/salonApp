<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Services\OpsApiDocumentationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;

class OpsDocumentationController extends Controller
{
    public function __construct(
        private readonly OpsApiDocumentationService $docs,
    ) {}

    public function index(Request $request): View
    {
        $section = (string) $request->query('section', '');
        $search = (string) $request->query('q', '');

        return view('ops.docs', [
            'baseUrl' => rtrim((string) config('app.url'), '/').OpsApiDocumentationService::BASE_PATH,
            'total' => $this->docs->totalCount(),
            'sections' => $this->docs->sections(),
            'endpoints' => $this->docs->endpoints($section !== '' ? $section : null, $search),
            'activeSection' => $section,
            'search' => $search,
        ]);
    }

    public function export(): Response
    {
        return response($this->docs->toMarkdown(), 200, [
            'Content-Type' => 'text/markdown; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="schedelux-api-'.now()->format('Y-m-d').'.md"',
        ]);
    }
}
