import { isDueDateOverdue } from '../../../utils/is-due-date-overdue';
import type { MeetingMonitorItem } from '../types/meetings.types';

export const isMeetingScheduleOverdue = (
  item: Pick<MeetingMonitorItem, 'meetingDatetime' | 'status'>
): boolean => item.status === 'SCHEDULED' && isDueDateOverdue(item.meetingDatetime);
