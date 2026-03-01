import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface ReportFiltersProps {
    filters: { date_from: string; date_to: string; [key: string]: string };
    routeName: string;
    exportSlug: string;
}

export const ReportFilters = ({ filters, routeName, exportSlug }: ReportFiltersProps) => {
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);

    const apply = () => {
        router.get(route(routeName), { date_from: dateFrom, date_to: dateTo }, { preserveState: true });
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
                <span className="text-sm">to</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
                <Button variant="outline" size="sm" onClick={apply}>Apply</Button>
            </div>
            <div className="flex items-center gap-2">
                <a href={route('reports.export.csv', { report: exportSlug, date_from: dateFrom, date_to: dateTo })}>
                    <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
                </a>
                <a href={route('reports.export.pdf', { report: exportSlug, date_from: dateFrom, date_to: dateTo })}>
                    <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
                </a>
            </div>
        </div>
    );
};
