import { Button } from '@/components/ui/button';
import { PaginatedData } from '@/types';
import { router } from '@inertiajs/react';

interface PaginationLinksProps {
    data: PaginatedData<unknown>;
}

export function PaginationLinks({ data }: PaginationLinksProps) {
    if (data.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between px-2 py-3">
            <p className="text-sm text-muted-foreground">
                Showing {data.from} to {data.to} of {data.total} results
            </p>
            <div className="flex items-center gap-1">
                {data.links.map((link, i) => (
                    <Button
                        key={i}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className="h-8 min-w-8"
                    />
                ))}
            </div>
        </div>
    );
}
