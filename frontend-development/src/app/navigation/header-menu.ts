import type { ElementType } from 'react';
import { LogOut } from 'lucide-react';

export interface HeaderMenuItem {
  label: string;
  path: string;
  icon?: ElementType;
  isDanger?: boolean;
}

export const headerUserMenu: HeaderMenuItem[] = [
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
  { label: 'Logout', path: '/login', icon: LogOut, isDanger: true }
];
