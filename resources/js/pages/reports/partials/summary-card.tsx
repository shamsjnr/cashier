interface SummaryCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
    trend?: number;
}

export const SummaryCard = ({ label, value, sublabel, trend }: SummaryCardProps) => {
    return (
        <div className="border rounded-xl p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
            {trend !== undefined && (
                <div className={'text-xs mt-1 font-medium ' + (trend >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {trend >= 0 ? '\u2191' : '\u2193'} {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
    );
};
