export type UserRole = 'MEO' | 'BD' | 'CEO' | 'STAFF_ADMIN';

export interface DummyUser {
  email: string;
  name: string;
  role: UserRole;
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
