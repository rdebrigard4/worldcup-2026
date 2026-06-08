// Kickoff times are stored in UTC; render them in the viewer's local zone.

export function fmtKickoffTime(iso: string, withTZ = true): string {
  if (!iso) return ''
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }
  if (withTZ) opts.timeZoneName = 'short'
  try {
    return new Date(iso).toLocaleTimeString([], opts)
  } catch {
    return ''
  }
}

export function fmtKickoffDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}
