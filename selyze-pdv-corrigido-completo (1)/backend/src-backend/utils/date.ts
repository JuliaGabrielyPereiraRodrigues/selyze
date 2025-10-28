export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

// ✅ CORRIGIDO: Não muta o objeto original
export function getStartOfDay(date?: Date): string {
  const d = new Date(date || new Date());
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getEndOfDay(date?: Date): string {
  const d = new Date(date || new Date());
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function getStartOfWeek(date?: Date): string {
  const d = new Date(date || new Date());
  const day = d.getDay();
  const diff = d.getDate() - day;
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export function getEndOfWeek(date?: Date): string {
  const d = new Date(date || new Date());
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  const sunday = new Date(d.setDate(diff));
  sunday.setHours(23, 59, 59, 999);
  return sunday.toISOString();
}

export function getStartOfMonth(date?: Date): string {
  const d = new Date(date || new Date());
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getEndOfMonth(date?: Date): string {
  const d = new Date(date || new Date());
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function diffInHours(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return Math.abs(d2.getTime() - d1.getTime()) / 36e5;
}