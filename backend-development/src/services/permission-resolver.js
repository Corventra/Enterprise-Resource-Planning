/**
 * Menghitung effective permission codes untuk response auth & JWT.
 *
 * - Role selain BD: pakai rolePermissionsFromDb (role_permissions) apa adanya.
 * - Role BD: hanya dari mapping department MEO / EXECUTIVE; union unik jika keduanya ada.
 *   Tidak memakai rolePermissionsFromDb sebagai sumber hak (menghindari melebarkan akses).
 *
 * @param {object} args
 * @param {string} args.roleCode
 * @param {Array<{ code?: string }>} [args.departments]
 * @param {string[]} args.rolePermissionsFromDb
 * @returns {string[]} unique, sorted alphabetically
 */
const BD_ROLE_CODE = 'BD';

/** Permission untuk BD yang punya department MEO (boleh juga punya EXECUTIVE — di-union). */
const BD_MEO_PERMISSIONS = ['BANK_DATA_VIEW', 'CAMPAIGN_MANAGE', 'FORM_MANAGE'];

/** Permission untuk BD yang punya department EXECUTIVE. */
const BD_EXECUTIVE_PERMISSIONS = [
  'BANK_DATA_VIEW',
  'BANK_DATA_PROCESS',
  'DOCUMENT_VIEW',
  'HANDOVER_MANAGE',
  'LEAD_MANAGE',
  'LEAD_TRACKER_VIEW',
  'LEAD_VIEW'
];

const sortUnique = (codes) => [...new Set(codes)].sort((a, b) => a.localeCompare(b));

const resolveEffectivePermissions = ({ roleCode, departments, rolePermissionsFromDb }) => {
  const fromDb = Array.isArray(rolePermissionsFromDb) ? rolePermissionsFromDb : [];

  if (roleCode !== BD_ROLE_CODE) {
    return sortUnique(fromDb);
  }

  const deptCodes = new Set(
    (departments || [])
      .map((d) => (d && typeof d.code === 'string' ? d.code : ''))
      .filter(Boolean)
  );

  const hasMeo = deptCodes.has('MEO');
  const hasExecutive = deptCodes.has('EXECUTIVE');

  const merged = [];
  if (hasMeo) merged.push(...BD_MEO_PERMISSIONS);
  if (hasExecutive) merged.push(...BD_EXECUTIVE_PERMISSIONS);

  return sortUnique(merged);
};

module.exports = {
  resolveEffectivePermissions,
  BD_MEO_PERMISSIONS,
  BD_EXECUTIVE_PERMISSIONS
};
