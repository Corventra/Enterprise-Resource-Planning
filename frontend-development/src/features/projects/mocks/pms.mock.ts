import type { ProjectAssignee } from '../types/project.types';

/**
 * PM pool yang bisa di-assign COO ke project. Email = id (mirror dummy auth).
 * `pm@erp.local` cocok dengan dummy login PM, sehingga setelah COO assign user
 * tersebut, login PM bisa langsung melihat project barunya di /projects.
 */
export const pmPool: ProjectAssignee[] = [
  { id: 'pm@erp.local', name: 'PM User' },
  { id: 'pm.senior@erp.local', name: 'Rina Kartika' },
  { id: 'pm.lead@erp.local', name: 'Budi Hartono' }
];
