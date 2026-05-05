import {
  LayoutDashboard,
  Megaphone,
  Landmark,
  LineChart,
  Handshake,
  CheckCircle2,
  Briefcase,
  Receipt,
  FolderOpen,
  Settings,
  TrendingUp,
  Users,
  ShieldCheck,
  Building2
} from 'lucide-react';
import type { SidebarNavItem } from '../../types/navigation';
import { ROLES } from '../permissions';

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
    group: 'Main',
    permission: [ROLES.MEO]
  },
  {
    label: 'Bank Data',
    path: '/bank-data',
    icon: Landmark,
    group: 'Main',
    permission: [ROLES.MEO, ROLES.BD]
  },
  {
    label: 'Lead Tracker',
    path: '/lead-tracker',
    icon: LineChart,
    group: 'Main',
    permission: [ROLES.BD, ROLES.CEO, ROLES.COO]
  },
  {
    label: 'Handover',
    path: '/handover',
    icon: Handshake,
    group: 'Main',
    permission: [ROLES.BD, ROLES.CEO, ROLES.COO]
  },
  {
    label: 'Approval',
    path: '/approval',
    icon: CheckCircle2,
    group: 'Main',
    permission: [ROLES.CEO, ROLES.COO]
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: Briefcase,
    group: 'Main',
    permission: [ROLES.COO, ROLES.PM, ROLES.CONSULTANT, ROLES.CEO, ROLES.HRD]
  },
  {
    label: 'KPI',
    path: '/kpi',
    icon: TrendingUp,
    group: 'Main',
    permission: [ROLES.HRD, ROLES.CEO, ROLES.COO, ROLES.PM, ROLES.CONSULTANT]
  },
  {
    label: 'Invoice',
    path: '/invoice',
    icon: Receipt,
    group: 'Main',
    permission: [ROLES.STAFF_ADMIN]
  },
  {
    label: 'Document Center',
    path: '/document-center',
    icon: FolderOpen,
    group: 'Main',
    permission: [ROLES.BD, ROLES.CEO, ROLES.COO, ROLES.PM, ROLES.CONSULTANT, ROLES.STAFF_ADMIN, ROLES.HRD]
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    group: 'System'
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: Users,
    group: 'Administration',
    permission: [ROLES.SUPERADMIN]
  },
  {
    label: 'Departments',
    path: '/admin/departments',
    icon: Building2,
    group: 'Administration',
    permission: [ROLES.SUPERADMIN]
  },
  {
    label: 'System Settings',
    path: '/admin/system-settings',
    icon: ShieldCheck,
    group: 'Administration',
    permission: [ROLES.SUPERADMIN]
  }
];
