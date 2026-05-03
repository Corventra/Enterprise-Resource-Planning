import type { ElementType } from 'react';
import type { Role } from '../app/permissions';

export interface SidebarNavItem {
  label: string;
  path: string;
  icon?: ElementType;
  group?: string;
  children?: SidebarNavItem[];
  /** If set, item is only shown when current user role is in this list. */
  permission?: Role[];
}
