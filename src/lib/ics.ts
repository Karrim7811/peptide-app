// Generates an iCalendar (.ics) feed from dosing reminders. Each active
// reminder becomes a weekly-recurring VEVENT with a VALARM, so the user's own
// phone/desktop calendar fires the native alert at each dose time. This keeps
// the "alarm" on the platform the user already trusts and needs no push
// infrastructure. Times are floating (local wall-clock) so a reminder set for
// 8:00 AM fires at 8:00 AM wherever the user is.

export interface ReminderForICS {
  id: string
  time: string // "HH:MM" 24h
  days_of_week: number[] // 0=Sun .. 6=Sat
  dose?: string | null
  stack_item?: { name?: string | null } | null
}

const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// Floating local time: YYYYMMDDTHHMMSS (no Z, no TZID).
function formatFloating(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  )
}

// UTC timestamp for DTSTAMP: YYYYMMDDTHHMMSSZ.
function formatUTC(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

// First date at/after `now` that matches one of the selected weekdays, at the
// reminder's time-of-day. Used as the recurrence anchor (DTSTART).
function nextOccurrence(time: string, days: number[], now: Date): Date {
  const [h, m] = time.split(':').map(Number)
  for (let i = 0; i < 8; i++) {
    const cand = new Date(now)
    cand.setDate(now.getDate() + i)
    cand.setHours(h, m, 0, 0)
    if (days.includes(cand.getDay()) && cand.getTime() >= now.getTime()) {
      return cand
    }
  }
  const fallback = new Date(now)
  fallback.setHours(h, m, 0, 0)
  return fallback
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function remindersToICS(reminders: ReminderForICS[], now: Date = new Date()): string {
  const dtstamp = formatUTC(now)
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Peptide Cortex//Dosing Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const r of reminders) {
    if (!r.days_of_week?.length) continue
    const name = r.stack_item?.name?.trim() || 'Peptide'
    const dose = r.dose?.trim() ? ` (${r.dose.trim()})` : ''
    const byday = r.days_of_week.map((d) => ICS_DAYS[d]).filter(Boolean).join(',')
    if (!byday) continue
    const start = nextOccurrence(r.time, r.days_of_week, now)
    const end = new Date(start.getTime() + 15 * 60 * 1000)

    lines.push(
      'BEGIN:VEVENT',
      `UID:${r.id}@peptidecortex.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${formatFloating(start)}`,
      `DTEND:${formatFloating(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
      `SUMMARY:${escapeText(`Peptide Cortex — ${name}${dose}`)}`,
      `DESCRIPTION:${escapeText('Dosing reminder from Peptide Cortex. For research and educational reference only — not medical advice.')}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Peptide Cortex reminder',
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// Triggers a client-side download of the .ics file. The OS/calendar app then
// prompts the user to add the events — that prompt is the consent step.
export function downloadICS(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
