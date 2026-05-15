const userRepo = require('../repositories/user.repo');

const COO_ROLE = 'COO';

/**
 * @typedef {object} HandoverAccessContext
 * @property {string|null} roleCode
 * @property {number|null} userId
 * @property {number[]|null} restrictToDepartmentIds - null = no department filter (non-COO)
 */

/**
 * @param {import('express').Request} req
 * @returns {Promise<HandoverAccessContext>}
 */
const buildHandoverAccessFromRequest = async (req) => {
  const userId = Number(req.user?.sub);
  const roleCode = req.user?.role ?? null;

  if (roleCode !== COO_ROLE) {
    return { roleCode, userId: Number.isInteger(userId) ? userId : null, restrictToDepartmentIds: null };
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return { roleCode, userId: null, restrictToDepartmentIds: [] };
  }

  const departmentIds = await userRepo.listDepartmentIdsByUserId(userId);
  return { roleCode, userId, restrictToDepartmentIds: departmentIds };
};

/**
 * @param {number|null|undefined} handoverDepartmentId
 * @param {HandoverAccessContext} access
 */
const isHandoverAllowedForAccess = (handoverDepartmentId, access) => {
  if (access.restrictToDepartmentIds == null) {
    return true;
  }
  if (access.restrictToDepartmentIds.length === 0) {
    return false;
  }
  if (handoverDepartmentId == null) {
    return false;
  }
  const deptId = Number(handoverDepartmentId);
  return access.restrictToDepartmentIds.some((id) => Number(id) === deptId);
};

module.exports = {
  COO_ROLE,
  buildHandoverAccessFromRequest,
  isHandoverAllowedForAccess
};
