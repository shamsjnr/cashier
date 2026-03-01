import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, KeyRound } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLogoIcon from '@/components/app-logo-icon';

interface Props {
    appName: string;
}

export default function ActivateLicense({ appName }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        license_key: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('license.store'));
    };

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:px-0">
            <Head title="Activate License" />

            {/* Right panel - activation form */}
            <div className="w-full lg:p-8 lg:col-span-3">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                    <div className="relative z-20 flex items-center justify-center lg:hidden">
                        <AppLogoIcon />
                    </div>

                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <div className="flex items-center gap-2">
                            <KeyRound className="h-6 w-6 text-green-600" />
                            <h1 className="text-xl font-medium">Activate Your License</h1>
                        </div>
                        <p className="text-muted-foreground text-sm text-balance">
                            Enter the license key provided to you to activate this installation.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="license_key">License Key</Label>
                            <Input
                                id="license_key"
                                value={data.license_key}
                                onChange={(e) => setData('license_key', e.target.value.toUpperCase())}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                autoFocus
                                autoComplete="off"
                                className="font-mono tracking-wider"
                            />
                            <InputError message={errors.license_key} />
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Activate License
                        </Button>
                    </form>

                    <p className="text-muted-foreground text-center text-xs">
                        Contact your vendor if you don't have a license key.
                    </p>
                </div>
            </div>
        </div>
    );
}
