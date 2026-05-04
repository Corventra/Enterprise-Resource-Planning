import type { ProjectAssignee } from '../types/project.types';

/**
 * Consultant pool yang bisa di-assign PM ke project. Email = id (mirror dummy auth).
 * `consultant@erp.local` cocok dengan dummy login Consultant — kalau dipilih, project
 * akan langsung tampak di /projects untuk login tersebut.
 */
export const consultantPool: ProjectAssignee[] = [
  { id: 'consultant@erp.local', name: 'Consultant User' },
  { id: 'consultant.junior@erp.local', name: 'Sari Anggraini' },
  { id: 'consultant.lead@erp.local', name: 'Dimas Hartanto' },
  { id: 'consultant.senior@erp.local', name: 'Maya Pratiwi' },
  { id: 'consultant.spec@erp.local', name: 'Ardi Wibowo' }
];
