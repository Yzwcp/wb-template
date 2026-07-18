import dayjs from 'dayjs'

export function formatDateTime(date: string | Date | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatDate(date: string | Date | number, format = 'YYYY-MM-DD'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}
