import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    TooltipProps,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
            <p className="text-muted-foreground mb-1">{label}</p>
            <p className="font-semibold">
                ₦{Number(payload[0].value ?? 0).toLocaleString()}
            </p>
        </div>
    );
};

export const Chart = ({ data }: { data: object[] }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
            >
                <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tickFormatter={(v) => v === 0 ? '0' : `₦${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#16a34a"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#16a34a' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};
