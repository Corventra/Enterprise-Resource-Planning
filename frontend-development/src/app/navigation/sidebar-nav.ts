import {
  LayoutDashboard,
  Megaphone,
  Landmark,
  LineChart,
  CalendarDays,
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
import { PERMISSIONS, ROLES } from '../permissions';

export const sidebarNavItems: SidebarNavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    group: 'Main'
  },
  {
    label: 'Approval',
    path: '/approval',
    icon: CheckCircle2,
    group: 'Main',
    permission: [ROLES.CEO, ROLES.COO]
  },
  {
    label: 'Campaigns',
    path: '/campaigns',
    icon: Megaphone,
    group: 'Main',
    anyPermission: [PERMISSIONS.CAMPAIGN_VIEW, PERMISSIONS.CAMPAIGN_MANAGE]
  },
  {
    label: 'Bank Data',
    path: '/bank-data',
    icon: Landmark,
    group: 'Main',
    anyPermission: [PERMISSIONS.BANK_DATA_VIEW]
  },
  {
    label: 'Lead Tracker',
    path: '/lead-tracker',
    icon: LineChart,
    group: 'Main',
    anyPermission: [PERMISSIONS.LEAD_TRACKER_VIEW]
  },
  {
    label: 'Meeting',
    path: '/meetings',
    icon: CalendarDays,
    group: 'Main',
    permission: [ROLES.CEO, ROLES.BD]
  },
  {
    label: 'Handover',
    path: '/handover',
    icon: Handshake,
    group: 'Main',
    anyPermission: [PERMISSIONS.HANDOVER_MANAGE, PERMISSIONS.HANDOVER_APPROVE]
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: Briefcase,
    group: 'Main',
    anyPermission: [PERMISSIONS.PROJECT_VIEW]
  },
  {
    label: 'KPI',
    path: '/kpi',
    icon: TrendingUp,
    group: 'Main',
    anyPermission: [PERMISSIONS.KPI_VIEW_OWN, PERMISSIONS.KPI_VIEW_TEAM, PERMISSIONS.KPI_VIEW_ALL]
  },
  {
    label: 'Invoice',
    path: '/invoice',
    icon: Receipt,
    group: 'Main',
    anyPermission: [PERMISSIONS.INVOICE_MANAGE]
  },
  {
    label: 'Document Center',
    path: '/document-center',
    icon: FolderOpen,
    group: 'Main',
    anyPermission: [PERMISSIONS.DOCUMENT_VIEW]
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
    anyPermission: [PERMISSIONS.USER_MANAGE]
  },
  {
    label: 'Departments',
    path: '/admin/departments',
    icon: Building2,
    group: 'Administration',
    anyPermission: [PERMISSIONS.DEPARTMENT_MANAGE]
  },
  {
    label: 'System Settings',
    path: '/admin/system-settings',
    icon: ShieldCheck,
    group: 'Administration',
    anyPermission: [PERMISSIONS.SYSTEM_CONFIG]
  }
];
