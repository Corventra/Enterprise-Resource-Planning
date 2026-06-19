/**
 * KF-07: Deteksi Keterlambatan milestone.
 *
 * Bandingkan progres aktual (completedAt) atau hari ini (untuk milestone aktif)
 * vs targetDate. Tidak menyimpan ke DB — pure derive di FE supaya tidak
 * coupling dengan WFMS state machine.
 *
 * Status semantic:
 * - 'late'    : milestone Done tapi completedAt > targetDate
 * - 'overdue' : milestone bukan Done & bukan Blocked, today > targetDate
 * - 'on-time' : milestone Done & completedAt <= targetDate
 * - null      : tidak relevan (Pending masih dalam range, Blocked, dll)
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type LatenessStatus = 'late' | 'overdue' | 'on-time' | null;

export interface LatenessResult {
  status: LatenessStatus;
  /** Selisih hari (positif = telat, negatif = lebih awal). 0 kalau on-time pas. */
  delayDays: number;
  /** Label siap-tampil. */
  label: string;
}

interface MilestoneShape {
  status: string;
  targetDate: string;
  completedAt?: string | null;
}

const diffDays = (later: number, earlier: number): number =>
  Math.floor((later - earlier) / MS_PER_DAY);

export const computeMilestoneLateness = (milestone: MilestoneShape): LatenessResult => {
  const target = new Date(milestone.targetDate).getTime();
  if (Number.isNaN(target)) {
    return { status: null, delayDays: 0, label: '' };
  }

  if (milestone.status === 'Done') {
    if (!milestone.completedAt) {
      return { status: null, delayDays: 0, label: '' };
    }
    const done = new Date(milestone.completedAt).getTime();
    if (Number.isNaN(done)) return { status: null, delayDays: 0, label: '' };
    const delta = diffDays(done, target);
    if (delta > 0) {
      return { status: 'late', delayDays: delta, label: `Late ${delta} day${delta === 1 ? '' : 's'}` };
    }
    return { status: 'on-time', delayDays: delta, label: 'On time' };
  }

  // Aktif (Pending / In Progress). Blocked tidak di-count karena ada blocker eksternal.
  if (milestone.status === 'Blocked') {
    return { status: null, delayDays: 0, label: '' };
  }

  const now = Date.now();
  if (now > target) {
    const delta = diffDays(now, target);
    return { status: 'overdue', delayDays: delta, label: `Overdue ${delta} day${delta === 1 ? '' : 's'}` };
  }
  return { status: null, delayDays: 0, label: '' };
};
