<?php

namespace App\Http\Controllers;

use App\Models\Receipt;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class Dashboard extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = [
            'chart' => $this->getDailyPayments(),
            'margins' => $this->getProfitMargin()
        ];
        return Inertia::render('dashboard', $data);
    }

    public function getDailyPayments()
    {
        $dailyReceipt = [];
        $currentDate = Carbon::today()->subDays(7);

        // Loop through each day
        for ($i = 6; $i >= 0; $i--) {
            $currentDate = Carbon::today()->subDays($i);

            // Get receipts for this specific date
            $receipts = Receipt::selectRaw("
                DATE(p.created_at) as date,
                COALESCE(SUM(rd.price * rd.quantity), 0) as total
            ")
            ->from((new Receipt)->getTable() . ' as p')
            ->leftJoin('receipt_data as rd', 'rd.receipt_id', '=', 'p.id')
            ->whereDate('p.created_at', $currentDate)
            ->groupBy(DB::raw('DATE(p.created_at)'))
            ->first();

            // Ensure we have data for this date
            $dailyReceipt[] = [
                'date' => $currentDate->format('D'),
                'amount' => $receipts ? $receipts->total : 0
            ];
        }

        // Sort by date ascending
        // usort($dailyReceipt, function($a, $b) {
        //     return strtotime($b['date']) - strtotime($a['date']);
        // });

        // // Format data for frontend
        // $formattedData = $dailyReceipt->map(function ($receipt) {
        //     return [
        //         'date' => date('D', strtotime($receipt->date)),
        //         'totalAmount' => floatval($receipt->total),
        //     ];
        // });

        return [
            'data' => $dailyReceipt,
            'labels' => [],
        ];
    }

    public function getProfitMargin()
    {
        // Calculate yesterday vs today totals
        $todayQuery = Receipt::leftJoin('receipt_data as rd', 'rd.receipt_id', '=', 'p.id')
            ->whereDate('p.created_at', Carbon::today())
            ->selectRaw('COALESCE(SUM(rd.price * rd.quantity), 0) as total')->from((new Receipt)->getTable() . ' as p');

        $yesterdayQuery = Receipt::leftJoin('receipt_data as rd', 'rd.receipt_id', '=', 'p.id')
            ->whereDate('p.created_at', '<=', Carbon::yesterday())
            ->orderBy('p.created_at', 'DESC')
            ->selectRaw('COALESCE(SUM(rd.price * rd.quantity), 0) as total')->from((new Receipt)->getTable() . ' as p');

        $todayTotal = $todayQuery->first()->total;
        $yesterdayTotal = $yesterdayQuery->first()->total;

        // Calculate profit margin percentage
        if ($yesterdayTotal === 0) {
            $profitMargin = 100; // Handle division by zero
        } else {
            $profitMargin = (($todayTotal - $yesterdayTotal) / $yesterdayTotal) * 100;
        }

        return [
            'today' => floatval($todayTotal),
            'yesterday' => floatval($yesterdayTotal),
            'profitMargin' => floatval($profitMargin),
        ];
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
