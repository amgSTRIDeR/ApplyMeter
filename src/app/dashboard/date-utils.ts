import type { DashboardPeriod } from './dashboard.models';

export function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  ) {
    return date;
  }

  return null;
}

export function getPeriodStartDate(
  period: DashboardPeriod,
  referenceDate = new Date(),
): Date | null {
  const dayCount: Partial<Record<DashboardPeriod, number>> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };
  const days = dayCount[period];

  if (!days) {
    return null;
  }

  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return start;
}

export function getLocalDateString(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
