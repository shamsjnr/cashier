<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Item;
use App\Models\Receipt;
use App\Models\ReceiptData;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('reports/index');
    }

    public function salesSummary(Request $request)
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());
        $groupBy = $request->input('group_by', 'day');

        $format = match ($groupBy) {
            'week' => "strftime('%Y-W%W', receipts.created_at)",
            'month' => "strftime('%Y-%m', receipts.created_at)",
            default => "DATE(receipts.created_at)",
        };

        $data = Receipt::selectRaw("{$format} as period, COUNT(*) as receipt_count, SUM(total) as revenue")
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $totals = Receipt::whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->selectRaw('COUNT(*) as total_receipts, COALESCE(SUM(total), 0) as total_revenue, COALESCE(AVG(total), 0) as avg_receipt')
            ->first();

        return Inertia::render('reports/sales-summary', [
            'data' => $data,
            'totals' => $totals,
            'filters' => ['date_from' => $dateFrom, 'date_to' => $dateTo, 'group_by' => $groupBy],
        ]);
    }

    public function salesByItem(Request $request)
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());

        $data = ReceiptData::selectRaw('receipt_data.name, SUM(receipt_data.quantity) as total_quantity, SUM(receipt_data.price * receipt_data.quantity) as total_revenue')
            ->join('receipts', 'receipts.id', '=', 'receipt_data.receipt_id')
            ->whereDate('receipts.created_at', '>=', $dateFrom)
            ->whereDate('receipts.created_at', '<=', $dateTo)
            ->groupBy('receipt_data.name')
            ->orderByDesc('total_revenue')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('reports/sales-by-item', [
            'data' => $data,
            'filters' => ['date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    public function salesByStaff(Request $request)
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());

        $data = Receipt::selectRaw('users.name as staff_name, users.id as staff_id, COUNT(receipts.id) as receipt_count, COALESCE(SUM(receipts.total), 0) as total_revenue, COALESCE(AVG(receipts.total), 0) as avg_receipt')
            ->join('users', 'users.id', '=', 'receipts.user_id')
            ->whereDate('receipts.created_at', '>=', $dateFrom)
            ->whereDate('receipts.created_at', '<=', $dateTo)
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_revenue')
            ->get();

        return Inertia::render('reports/sales-by-staff', [
            'data' => $data,
            'filters' => ['date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    public function profitReport(Request $request)
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());

        $data = ReceiptData::selectRaw('receipt_data.name, SUM(receipt_data.quantity) as total_quantity, SUM(receipt_data.price * receipt_data.quantity) as total_revenue, SUM(COALESCE(items.cost_price, 0) * receipt_data.quantity) as total_cost')
            ->join('receipts', 'receipts.id', '=', 'receipt_data.receipt_id')
            ->leftJoin('items', 'items.uuid', '=', 'receipt_data.item_id')
            ->whereDate('receipts.created_at', '>=', $dateFrom)
            ->whereDate('receipts.created_at', '<=', $dateTo)
            ->groupBy('receipt_data.name')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(function ($item) {
                $item->profit = $item->total_revenue - $item->total_cost;
                $item->margin = $item->total_revenue > 0
                    ? round(($item->profit / $item->total_revenue) * 100, 1)
                    : 0;
                return $item;
            });

        $totals = [
            'revenue' => $data->sum('total_revenue'),
            'cost' => $data->sum('total_cost'),
            'profit' => $data->sum('profit'),
        ];
        $totals['margin'] = $totals['revenue'] > 0
            ? round(($totals['profit'] / $totals['revenue']) * 100, 1)
            : 0;

        return Inertia::render('reports/profit', [
            'data' => $data,
            'totals' => $totals,
            'filters' => ['date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    public function inventoryReport()
    {
        $items = Item::with('category:id,name,color')
            ->where('track_stock', true)
            ->orderBy('name')
            ->get()
            ->map(function ($item) {
                $item->stock_value = $item->stock_quantity * $item->cost_price;
                $item->retail_value = $item->stock_quantity * $item->price;
                return $item;
            });

        $totals = [
            'total_items' => $items->count(),
            'total_stock' => $items->sum('stock_quantity'),
            'stock_value' => $items->sum('stock_value'),
            'retail_value' => $items->sum('retail_value'),
            'low_stock_count' => $items->filter(fn ($i) => $i->stock_quantity <= $i->low_stock_threshold)->count(),
        ];

        return Inertia::render('reports/inventory', [
            'items' => $items,
            'totals' => $totals,
        ]);
    }

    public function expenseReport(Request $request)
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());

        $byCategory = Expense::selectRaw('category, SUM(amount) as total, COUNT(*) as count')
            ->whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $totalExpenses = $byCategory->sum('total');

        $totalRevenue = Receipt::whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->sum('total');

        return Inertia::render('reports/expenses', [
            'byCategory' => $byCategory,
            'totals' => [
                'expenses' => $totalExpenses,
                'revenue' => $totalRevenue,
                'net' => $totalRevenue - $totalExpenses,
            ],
            'filters' => ['date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    public function exportCsv(Request $request, string $report): StreamedResponse
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());

        return response()->streamDownload(function () use ($report, $dateFrom, $dateTo) {
            $handle = fopen('php://output', 'w');

            match ($report) {
                'sales-summary' => $this->exportSalesSummaryCsv($handle, $dateFrom, $dateTo),
                'sales-by-item' => $this->exportSalesByItemCsv($handle, $dateFrom, $dateTo),
                'sales-by-staff' => $this->exportSalesByStaffCsv($handle, $dateFrom, $dateTo),
                'inventory' => $this->exportInventoryCsv($handle),
                'expenses' => $this->exportExpensesCsv($handle, $dateFrom, $dateTo),
                default => fputcsv($handle, ['No data']),
            };

            fclose($handle);
        }, "{$report}-{$dateFrom}-to-{$dateTo}.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function exportPdf(Request $request, string $report)
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());

        $data = match ($report) {
            'sales-summary' => $this->getSalesSummaryData($dateFrom, $dateTo),
            'sales-by-item' => $this->getSalesByItemData($dateFrom, $dateTo),
            default => ['title' => 'Report', 'data' => [], 'dateFrom' => $dateFrom, 'dateTo' => $dateTo],
        };

        $data['businessName'] = config('app.name');
        $data['dateFrom'] = $dateFrom;
        $data['dateTo'] = $dateTo;
        $data['report'] = $report;

        $pdf = Pdf::loadView('reports.pdf.report', $data);
        return $pdf->download("{$report}-{$dateFrom}-to-{$dateTo}.pdf");
    }

    // CSV export helpers
    private function exportSalesSummaryCsv($handle, $dateFrom, $dateTo): void
    {
        fputcsv($handle, ['Date', 'Receipts', 'Revenue']);
        $data = Receipt::selectRaw("DATE(created_at) as period, COUNT(*) as receipt_count, SUM(total) as revenue")
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->groupBy('period')
            ->orderBy('period')
            ->get();
        foreach ($data as $row) {
            fputcsv($handle, [$row->period, $row->receipt_count, $row->revenue]);
        }
    }

    private function exportSalesByItemCsv($handle, $dateFrom, $dateTo): void
    {
        fputcsv($handle, ['Item', 'Quantity Sold', 'Revenue']);
        $data = ReceiptData::selectRaw('receipt_data.name, SUM(receipt_data.quantity) as total_quantity, SUM(receipt_data.price * receipt_data.quantity) as total_revenue')
            ->join('receipts', 'receipts.id', '=', 'receipt_data.receipt_id')
            ->whereDate('receipts.created_at', '>=', $dateFrom)
            ->whereDate('receipts.created_at', '<=', $dateTo)
            ->groupBy('receipt_data.name')
            ->orderByDesc('total_revenue')
            ->get();
        foreach ($data as $row) {
            fputcsv($handle, [$row->name, $row->total_quantity, $row->total_revenue]);
        }
    }

    private function exportSalesByStaffCsv($handle, $dateFrom, $dateTo): void
    {
        fputcsv($handle, ['Staff', 'Receipts', 'Revenue', 'Average']);
        $data = Receipt::selectRaw('users.name, COUNT(receipts.id) as receipt_count, SUM(receipts.total) as total_revenue, AVG(receipts.total) as avg_receipt')
            ->join('users', 'users.id', '=', 'receipts.user_id')
            ->whereDate('receipts.created_at', '>=', $dateFrom)
            ->whereDate('receipts.created_at', '<=', $dateTo)
            ->groupBy('users.id', 'users.name')
            ->get();
        foreach ($data as $row) {
            fputcsv($handle, [$row->name, $row->receipt_count, $row->total_revenue, round($row->avg_receipt, 2)]);
        }
    }

    private function exportInventoryCsv($handle): void
    {
        fputcsv($handle, ['Item', 'Category', 'Stock', 'Cost Price', 'Sell Price', 'Stock Value']);
        $items = Item::with('category:id,name')->where('track_stock', true)->orderBy('name')->get();
        foreach ($items as $item) {
            fputcsv($handle, [$item->name, $item->category?->name ?? 'N/A', $item->stock_quantity, $item->cost_price, $item->price, $item->stock_quantity * $item->cost_price]);
        }
    }

    private function exportExpensesCsv($handle, $dateFrom, $dateTo): void
    {
        fputcsv($handle, ['Category', 'Total', 'Count']);
        $data = Expense::selectRaw('category, SUM(amount) as total, COUNT(*) as count')
            ->whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->groupBy('category')
            ->get();
        foreach ($data as $row) {
            fputcsv($handle, [$row->category, $row->total, $row->count]);
        }
    }

    // Data helpers for PDF
    private function getSalesSummaryData($dateFrom, $dateTo): array
    {
        $data = Receipt::selectRaw("DATE(created_at) as period, COUNT(*) as receipt_count, SUM(total) as revenue")
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return ['title' => 'Sales Summary Report', 'data' => $data, 'columns' => ['Date', 'Receipts', 'Revenue']];
    }

    private function getSalesByItemData($dateFrom, $dateTo): array
    {
        $data = ReceiptData::selectRaw('receipt_data.name, SUM(receipt_data.quantity) as total_quantity, SUM(receipt_data.price * receipt_data.quantity) as total_revenue')
            ->join('receipts', 'receipts.id', '=', 'receipt_data.receipt_id')
            ->whereDate('receipts.created_at', '>=', $dateFrom)
            ->whereDate('receipts.created_at', '<=', $dateTo)
            ->groupBy('receipt_data.name')
            ->orderByDesc('total_revenue')
            ->get();

        return ['title' => 'Sales by Item Report', 'data' => $data, 'columns' => ['Item', 'Quantity', 'Revenue']];
    }
}
