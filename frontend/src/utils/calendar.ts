import { EventItem } from '../types';

/**
 * Parses event date (YYYY-MM-DD) and start_time (e.g. "10:00 AM" or "14:00") into Date objects
 */
function getEventStartAndEnd(event: EventItem): { start: Date; end: Date } {
  const dateStr = event.date || '2026-11-15';
  let hours = 10;
  let minutes = 0;

  if (event.start_time) {
    const raw = event.start_time.trim().toLowerCase();
    const isPM = raw.includes('pm');
    const isAM = raw.includes('am');
    const timeParts = raw.replace(/[^\d:]/g, '').split(':');
    if (timeParts.length >= 1) {
      let h = parseInt(timeParts[0], 10);
      const m = timeParts.length >= 2 ? parseInt(timeParts[1], 10) : 0;
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      if (!isNaN(h)) hours = h;
      if (!isNaN(m)) minutes = m;
    }
  }

  const [y, mo, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const start = new Date(y, (mo || 1) - 1, d || 1, hours, minutes);
  // Default duration 3 hours
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

  return { start, end };
}

function formatDateToICS(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Returns a direct Google Calendar web event URL
 */
export function getGoogleCalendarUrl(event: EventItem): string {
  const { start, end } = getEventStartAndEnd(event);
  const startISO = formatDateToICS(start);
  const endISO = formatDateToICS(end);

  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(
    `${event.description || ''}\n\nVenue: ${event.venue || ''}\nLocality: ${event.locality || ''}\nVerified via EventSphere Hyperlocal Platform.`
  );
  const location = encodeURIComponent(`${event.venue || ''}, ${event.locality || 'Bengaluru'}, India`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startISO}/${endISO}&details=${details}&location=${location}`;
}

/**
 * Triggers a browser download of a standards-compliant RFC 5545 .ics file
 */
export function downloadIcsFile(event: EventItem): void {
  const { start, end } = getEventStartAndEnd(event);
  const startISO = formatDateToICS(start);
  const endISO = formatDateToICS(end);
  const nowISO = formatDateToICS(new Date());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventSphere//Hyperlocal Event Discovery//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:eventsphere-${event.id}@eventsphere.io`,
    `DTSTAMP:${nowISO}`,
    `DTSTART:${startISO}`,
    `DTEND:${endISO}`,
    `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.venue || ''}, ${event.locality || 'Bengaluru'}`,
    `URL:https://eventsphere.io/events/${event.id}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.ics`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
