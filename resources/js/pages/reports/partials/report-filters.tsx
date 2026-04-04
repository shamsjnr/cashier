import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/date-picker';
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
                <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" />
                <span className="text-sm text-muted-foreground">to</span>
                <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" />
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
