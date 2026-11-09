import { VfsAppointment } from '@/types';

export const generateAndDownloadVfsIcs = (
  appointment: VfsAppointment,
  candidateName: string,
  passportNumber: string,
  caseOrderId: string,
  employerName: string
) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  // Start & End time (14 Nov 2026 11:30 AM NPT -> 05:45 UTC)
  const dtStart = '20261114T054500Z';
  const dtEnd = '20261114T064500Z';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Danish Agency for International Recruitment and Integration (SIRI)//VFS Desk//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:vfs-ktm-2026-8819-${Date.now()}@siri.dk`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:SIRI VFS Biometrics Appointment - ${candidateName} (${appointment.refNumber})`,
    `DESCRIPTION:Danish Agency for International Recruitment and Integration (SIRI)\\nApplicant: ${candidateName} (Passport: ${passportNumber})\\nEmployer: ${employerName}\\nScheme: Herdsmen & Farm Managers Scheme (DKK 35\\,705/mo)\\nCase Order ID: ${caseOrderId}\\nVFS Desk Ref: ${appointment.refNumber}\\nAction: In-person Biometrics & Original Passport Presentation\\nPlease arrive 15 minutes before the scheduled time slot.`,
    `LOCATION:${appointment.centerName}, ${appointment.address}`,
    'STATUS:CONFIRMED',
    'CLASS:PUBLIC',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: VFS Kathmandu Biometrics Appointment in 2 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SIRI_VFS_Appointment_Kathmandu_${candidateName.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
