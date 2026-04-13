import { Timestamp } from 'firebase/firestore';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';

export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function formatDate(date: Date | Timestamp, formatStr: string = 'dd.MM.yyyy'): string {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, formatStr, { locale: tr });
}

export function formatDateTime(date: Date | Timestamp): string {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: tr });
}

export function formatRelativeTime(date: Date | Timestamp): string {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: tr });
}

export function isDatePast(date: Date | Timestamp): boolean {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return isPast(dateObj);
}

export function isDateFuture(date: Date | Timestamp): boolean {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return isFuture(dateObj);
}














