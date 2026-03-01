import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';
import {
    BarChart3,
    Clock,
    FileTextIcon,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    ShoppingBasket,
    Tags,
    Users,
    Wallet,
} from 'lucide-react';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: route('dashboard'),
        icon: LayoutDashboard,
        fill: true,
    },
    {
        title: 'Receipts',
        url: route('receipt.list'),
        icon: FileTextIcon,
    },
    {
        title: 'Items',
        url: route('item.list'),
        icon: ShoppingBasket,
    },
    {
        title: 'Categories',
        url: route('category.list'),
        icon: Tags,
        permission: 'categories.manage',
    },
    {
        title: 'Customers',
        url: route('customer.list'),
        icon: Users,
        permission: 'customers.manage',
    },
    {
        title: 'Shifts',
        url: route('shift.list'),
        icon: Clock,
        permission: 'shifts.own',
    },
    {
        title: 'Expenses',
        url: route('expense.list'),
        icon: Wallet,
        permission: 'expenses.manage',
    },
    {
        title: 'Reports',
        url: route('reports.index'),
        icon: BarChart3,
        permission: 'reports.view',
    },
    {
        title: 'Staff',
        url: route('staff.list'),
        icon: ShieldCheck,
        permission: 'staff.view',
    },
    {
        title: 'Settings',
        url: route('pos-settings'),
        icon: Settings,
        permission: 'settings.manage',
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { can } = usePermissions();
    const { update } = usePage<SharedData>().props;

    const navs = mainNavItems.filter(
        (item) => !item.permission || can(item.permission),
    );

    // Add update badge to Settings nav item
    const updateAvailable = update?.available ?? false;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="pt-4">
                <NavMain items={navs} updateBadge={updateAvailable ? 'Settings' : undefined} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
