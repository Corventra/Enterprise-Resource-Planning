export const ROLES = {
  MEO: 'MEO',
  BD: 'BD',
  CEO: 'CEO',
  COO: 'COO',
  PM: 'PM',
  CONSULTANT: 'CONSULTANT',
  STAFF_ADMIN: 'STAFF_ADMIN',
  HRD: 'HRD',
  SUPERADMIN: 'SUPERADMIN'
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  MEO: 'Marketing & Engagement Officer',
  BD: 'Business Development',
  CEO: 'Chief Executive Officer',
  COO: 'Chief Operating Officer',
  PM: 'Project Manager',
  CONSULTANT: 'Consultant',
  STAFF_ADMIN: 'Staff Admin',
  HRD: 'Human Resources Department',
  SUPERADMIN: 'Superadmin'
};
