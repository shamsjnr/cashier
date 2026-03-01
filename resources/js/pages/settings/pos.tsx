import { Head, useForm } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'POS Settings',
        href: '/pos-settings',
    },
];

interface Props {
    settings: {
        shifts_enabled: boolean;
        business_name: string;
        currency_symbol: string;
    };
}

export default function PosSettings({ settings }: Props) {
    const { data, setData, put, processing } = useForm({
        shifts_enabled: settings.shifts_enabled,
        business_name: settings.business_name,
        currency_symbol: settings.currency_symbol,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put('/pos-settings');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="POS Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="POS Settings" description="Configure your point-of-sale system settings" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="business_name">Business Name</Label>
                                <Input
                                    id="business_name"
                                    value={data.business_name}
                                    onChange={(e) => setData('business_name', e.target.value)}
                                    placeholder="My Business"
                                />
                                <p className="text-muted-foreground text-sm">
                                    Displayed on receipts and reports.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency_symbol">Currency Symbol</Label>
                                <Input
                                    id="currency_symbol"
                                    value={data.currency_symbol}
                                    onChange={(e) => setData('currency_symbol', e.target.value)}
                                    placeholder="₦"
                                    className="w-24"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="shifts_enabled">Shift Management</Label>
                                    <p className="text-muted-foreground text-sm">
                                        When enabled, cashiers must open a shift before creating receipts.
                                    </p>
                                </div>
                                <Switch
                                    id="shifts_enabled"
                                    checked={data.shifts_enabled}
                                    onCheckedChange={(checked) => setData('shifts_enabled', checked)}
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save changes'}
                        </Button>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
