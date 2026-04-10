import type { DummyUser, LoginFormValues } from '../types/auth.types';

const DUMMY_ACCOUNTS = [
  { email: 'meo@erp.local', password: '12345678', role: 'MEO', name: 'MEO User' },
  { email: 'bd@erp.local', password: '12345678', role: 'BD', name: 'BD User' },
  { email: 'ceo@erp.local', password: '12345678', role: 'CEO', name: 'CEO User' },
  { email: 'admin@erp.local', password: '12345678', role: 'STAFF_ADMIN', name: 'Admin User' }
];

export const authService = {
  loginWithDummyAccount: async (credentials: LoginFormValues): Promise<DummyUser> => {
    // Simulate network delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = DUMMY_ACCOUNTS.find(
          u => u.email === credentials.email && u.password === credentials.password
        );
        
        if (user) {
          resolve({ email: user.email, name: user.name, role: user.role as any });
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
