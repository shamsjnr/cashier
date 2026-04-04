import { format, parseISO, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date', className }: DatePickerProps) {
    const parsed = value ? parseISO(value) : undefined;
    const selected = parsed && isValid(parsed) ? parsed : undefined;

    const handleSelect = (date: Date | undefined) => {
        onChange(date ? format(date, 'yyyy-MM-dd') : '');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-[150px] justify-start text-left font-normal',
                        !selected && 'text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selected ? format(selected, 'dd MMM yyyy') : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
