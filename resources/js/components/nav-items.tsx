import { NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { FileTextIcon, LayoutDashboard, ShieldCheck, UserCog2 } from 'lucide-react';

const User = (() => {
    const userdata = usePage()?.props?.auth?.user;
    console.log(userdata);
    return userdata;
})()

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: route('dashboard'),
        icon: LayoutDashboard,
        fill: true
    },
    {
        title: 'Staff',
        url: route('staff.list'),
        icon: ShieldCheck,
        adminOnly: true,
    },
    {
        title: 'Roles',
        url: route('role.list'),
        icon: UserCog2,
        adminOnly: true,
    },
    {
        title: 'Receipt Gen.',
        url: route('receipt.generate'),
        icon: FileTextIcon,
    },
];

export const navs = User?.is_admin === 1 ? mainNavItems : mainNavItems.filter( (item) => ! item.adminOnly );
