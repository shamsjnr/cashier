<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Receipt;
use App\Models\ReceiptData;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class Dashboard extends Controller
{
    public function index()
    {
        $todayRevenue = Receipt::whereDate('created_at', today())->sum('total');
        $yesterdayRevenue = Receipt::whereDate('created_at', today()->subDay())->sum('total');

        $data = [
            'chart' => $this->getDailyPayments(),
            'margins' => [
                'today' => floatval($todayRevenue),
                'yesterday' => floatval($yesterdayRevenue),
                'profitMargin' => $yesterdayRevenue > 0
                    ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1)
                    : ($todayRevenue > 0 ? 100 : 0),
            ],
            'todayStats' => [
                'receipts_count' => Receipt::whereDate('created_at', today())->count(),
                'total_revenue' => floatval($todayRevenue),
                'items_sold' => (int) ReceiptData::whereHas('receipt', fn ($q) => $q->whereDate('created_at', today()))->sum('quantity'),
            ],
            'lowStockItems' => Item::where('track_stock', true)
                ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                ->orderBy('stock_quantity')
                ->take(5)
                ->get(['uuid', 'name', 'stock_quantity', 'low_stock_threshold']),
            'recentReceipts' => Receipt::with('user:id,name')
                ->latest()
                ->take(5)
                ->get(['id', 'receipt_number', 'customer_name', 'total', 'payment_method', 'user_id', 'created_at']),
        ];

        return Inertia::render('dashboard', $data);
    }

    private function getDailyPayments(): array
    {
        $dailyReceipt = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);

            $total = Receipt::whereDate('created_at', $date)->sum('total');

            $dailyReceipt[] = [
                'date' => $date->format('D'),
                'amount' => floatval($total),
            ];
        }

        return [
            'data' => $dailyReceipt,
            'labels' => [],
        ];
    }
}
