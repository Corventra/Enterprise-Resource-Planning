import {
  LayoutDashboard,
  Megaphone,
  Landmark,
  LineChart,
  CheckCircle2,
  Receipt,
  FolderOpen,
  Settings
} from 'lucide-react';
import type { SidebarNavItem } from '../../types/navigation';

export const sidebarNavItems: SidebarNavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    group: 'Main'
  },
  {
    label: 'Campaigns',
    path: '/campaigns',
    icon: Megaphone,
    group: 'Main'
  },
  {
    label: 'Bank Data',
    path: '/bank-data',
    icon: Landmark,
    group: 'Main'
  },
  {
    label: 'Approval',
    path: '/approval',
    icon: CheckCircle2,
    group: 'Main'
  },
  {
    label: 'Invoices',
    path: '/invoices',
    icon: Receipt,
    group: 'Main'
  },
  {
    label: 'Document Center',
    path: '/document-center',
    icon: FolderOpen,
    group: 'Main'
  },
  {
    label: 'Lead Tracker',
    path: '/lead-tracker',
    icon: LineChart,
    group: 'Main'
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    group: 'System'
  }
];
