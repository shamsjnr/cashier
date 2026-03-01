import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useFlashToast() {
    const { flash } = usePage().props as { flash?: { status?: string; message?: string } };
    const lastMessage = useRef<string | null>(null);

    useEffect(() => {
        if (!flash?.status || !flash?.message) return;

        const key = `${flash.status}:${flash.message}`;
        if (lastMessage.current === key) return;
        lastMessage.current = key;

        switch (flash.status) {
            case 'success':
                toast.success(flash.message);
                break;
            case 'error':
                toast.error(flash.message);
                break;
            case 'info':
                toast.info(flash.message);
                break;
            default:
                toast(flash.message);
        }
    }, [flash?.status, flash?.message]);
}
