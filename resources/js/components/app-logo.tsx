import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="print:hidden flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center rounded-full overflow-hidden">
                    <AppLogoIcon />
                </div>
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-none font-semibold">Olimpia Phone Store</span>
                </div>
            </div>
            <div className="hidden print:flex flex-col gap-1 items-center font-semibold text-sm">
                <h2 className='text-2xl'>Olimpia Phone Stores</h2>
                <h5>RC-1814680</h5>
                <AppLogoIcon />
            </div>
        </>
    );
}
