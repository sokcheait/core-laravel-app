import { LayoutDashboard, Users, Settings, Key, type LucideIcon } from 'lucide-react';

export interface NavItem {
    label: string; // English text, also the key in lang/km.json
    href: string;
    icon: LucideIcon;
    badge?: string | number;
}

export interface NavGroup {
    label?: string;
    items: NavItem[];
}

export const navigation: NavGroup[] = [
    {
        items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
        label: 'User Management',
        items: [
            { label: 'Users', href: '/users', icon: Users },
            { label: 'Roles', href: '/roles', icon: Key }
        ],
    },
    // {
    //     label: 'Settings',
    //     items: [{ label: 'Settings', href: '/settings', icon: Settings }],
    // },
];