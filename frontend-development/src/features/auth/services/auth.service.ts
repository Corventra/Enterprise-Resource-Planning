import { ROLES, type Role } from '../../../app/permissions/roles';
import type { DummyUser, LoginFormValues } from '../types/auth.types';

const DUMMY_ACCOUNTS: Array<{ email: string; password: string; role: Role; name: string }> = [
  { email: 'meo@erp.local', password: '12345678', role: ROLES.MEO, name: 'MEO User' },
  { email: 'bd@erp.local', password: '12345678', role: ROLES.BD, name: 'BD User' },
  { email: 'ceo@erp.local', password: '12345678', role: ROLES.CEO, name: 'CEO User' },
  { email: 'coo@erp.local', password: '12345678', role: ROLES.COO, name: 'COO User' },
  { email: 'pm@erp.local', password: '12345678', role: ROLES.PM, name: 'PM User' },
  { email: 'consultant@erp.local', password: '12345678', role: ROLES.CONSULTANT, name: 'Consultant User' },
  { email: 'admin@erp.local', password: '12345678', role: ROLES.STAFF_ADMIN, name: 'Admin User' },
  { email: 'hrd@erp.local', password: '12345678', role: ROLES.HRD, name: 'HRD User' }
];

export const authService = {
  loginWithDummyAccount: async (credentials: LoginFormValues): Promise<DummyUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = DUMMY_ACCOUNTS.find(
          u => u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          resolve({ email: user.email, name: user.name, role: user.role });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
  },

  setStoredAuthUser: (user: DummyUser) => {
    localStorage.setItem('erp_auth_user', JSON.stringify(user));
  },

  getStoredAuthUser: (): DummyUser | null => {
    const data = localStorage.getItem('erp_auth_user');
    return data ? JSON.parse(data) : null;
  },

  clearStoredAuthUser: () => {
    localStorage.removeItem('erp_auth_user');
  }
};
