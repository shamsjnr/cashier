<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Report' }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 20px; }
        h1 { font-size: 18px; margin-bottom: 5px; }
        .meta { color: #666; margin-bottom: 20px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #fafafa; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background-color: #f0f0f0 !important; }
    </style>
</head>
<body>
    <h1>{{ $businessName ?? config('app.name') }}</h1>
    <h2>{{ $title ?? 'Report' }}</h2>
    <div class="meta">
        Period: {{ $dateFrom }} to {{ $dateTo }} | Generated: {{ now()->format('Y-m-d H:i') }}
    </div>

    @if(!empty($columns) && !empty($data))
    <table>
        <thead>
            <tr>
                @foreach($columns as $col)
                    <th>{{ $col }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    @foreach($row->toArray() as $value)
                        <td>{{ is_numeric($value) ? number_format($value, 2) : $value }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
    @else
        <p>No data available for this period.</p>
    @endif
</body>
</html>
