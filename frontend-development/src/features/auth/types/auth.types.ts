import type { Role } from '../../../app/permissions/roles';

/** @deprecated Use `Role` from `app/permissions` instead. */
export type UserRole = Role;

export interface DummyUser {
  email: string;
  name: string;
  role: Role;
}

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  submit?: string;
}
