import type { ElementType } from 'react';

export interface SidebarNavItem {
  label: string;
  path: string;
  icon?: ElementType;
  group?: string;
  children?: SidebarNavItem[];
}
