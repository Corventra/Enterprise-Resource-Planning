import type { ElementType } from 'react';
import type { Role, Permission } from '../app/permissions';

export interface SidebarNavItem {
  label: string;
  path: string;
  icon?: ElementType;
  group?: string;
  children?: SidebarNavItem[];
  /** If set, item is shown when current user role is in this list. */
  permission?: Role[];
  /**
   * If set, item is shown when `useAuth().canAny` is true for these permissions.
   * Combined with `permission` using OR (matches `PermissionGuard` patterns).
   */
  anyPermission?: Permission[];
}
