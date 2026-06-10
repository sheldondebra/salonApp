<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\TenantInvoice;
use App\Services\TenantInvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceInvoiceController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly TenantInvoiceService $invoices,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'max:32'],
            'customer_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'q' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->invoices->paginate(
            $tenant->id,
            $filters,
            (int) ($filters['per_page'] ?? 20),
        );

        return response()->json([
            'data' => collect($paginator->items())->map(fn (TenantInvoice $invoice) => $this->invoices->formatInvoice($invoice)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'summary' => $this->invoices->summary($tenant->id, $filters),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:users,id'],
            'branch_id' => ['nullable', 'integer', 'exists:locations,id'],
            'discount_total_cents' => ['nullable', 'integer', 'min:0'],
            'tax_total_cents' => ['nullable', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'terms' => ['nullable', 'string', 'max:5000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_price_cents' => ['required', 'integer', 'min:0'],
        ]);

        $invoice = $this->invoices->createManual(
            $tenant->id,
            $data,
            $data['items'],
            $request->user(),
        );

        return response()->json(['data' => $this->invoices->formatInvoice($invoice)], 201);
    }

    public function show(Request $request, string $tenantSlug, TenantInvoice $invoice): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($invoice->tenant_id === $tenant->id, 404);

        return response()->json([
            'data' => $this->invoices->formatInvoice($this->invoices->find($tenant->id, $invoice->id)),
        ]);
    }

    public function update(Request $request, string $tenantSlug, TenantInvoice $invoice): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:users,id'],
            'branch_id' => ['nullable', 'integer', 'exists:locations,id'],
            'discount_total_cents' => ['nullable', 'integer', 'min:0'],
            'tax_total_cents' => ['nullable', 'integer', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'terms' => ['nullable', 'string', 'max:5000'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_price_cents' => ['required_with:items', 'integer', 'min:0'],
        ]);

        $updated = $this->invoices->update(
            $tenant->id,
            $invoice,
            $data,
            $data['items'] ?? null,
            $request->user(),
        );

        return response()->json(['data' => $this->invoices->formatInvoice($updated)]);
    }

    public function send(Request $request, string $tenantSlug, TenantInvoice $invoice): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        $sent = $this->invoices->send($tenant->id, $invoice);

        return response()->json([
            'data' => $this->invoices->formatInvoice($sent),
            'message' => 'Invoice marked as sent. SMS and email delivery will follow your notification settings.',
        ]);
    }

    public function recordPayment(Request $request, string $tenantSlug, TenantInvoice $invoice): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'amount_cents' => ['required', 'integer', 'min:1'],
            'payment_method' => ['nullable', 'string', 'max:32'],
            'reference' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $updated = $this->invoices->recordPayment($tenant->id, $invoice, $data, $request->user());

        return response()->json(['data' => $this->invoices->formatInvoice($updated)]);
    }

    public function cancel(Request $request, string $tenantSlug, TenantInvoice $invoice): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        $cancelled = $this->invoices->cancel($tenant->id, $invoice);

        return response()->json(['data' => $this->invoices->formatInvoice($cancelled)]);
    }

    public function fromBooking(Request $request, string $tenantSlug, int $bookingId): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        $invoice = $this->invoices->createFromBooking($tenant->id, $bookingId, $request->user());

        return response()->json(['data' => $this->invoices->formatInvoice($invoice)], 201);
    }

    public function fromPosSale(Request $request, string $tenantSlug, int $saleId): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        $invoice = $this->invoices->createFromPosSale($tenant->id, $saleId, $request->user());

        return response()->json(['data' => $this->invoices->formatInvoice($invoice)], 201);
    }

    public function receipt(Request $request, string $tenantSlug, TenantInvoice $invoice): JsonResponse
    {
        $this->authorize('viewFinance');

        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($invoice->tenant_id === $tenant->id, 404);

        $full = $this->invoices->find($tenant->id, $invoice->id);

        return response()->json([
            'data' => [
                'invoice' => $this->invoices->formatInvoice($full),
                'tenant' => [
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                ],
            ],
        ]);
    }
}
