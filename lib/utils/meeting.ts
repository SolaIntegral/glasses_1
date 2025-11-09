'use client';

const DEFAULT_MEETING_URL =
  process.env.NEXT_PUBLIC_DEFAULT_MEETING_URL || 'https://meet.google.com/kdd-mtnd-eyc';

const APP_HOSTS = new Set([
  'glasses1-582eb.web.app',
  'localhost',
  '127.0.0.1',
]);

export const resolveMeetingUrl = (originalUrl?: string | null): string => {
  if (!originalUrl) {
    return DEFAULT_MEETING_URL;
  }

  const trimmed = originalUrl.trim();
  if (!trimmed) {
    return DEFAULT_MEETING_URL;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return DEFAULT_MEETING_URL;
    }
    if (APP_HOSTS.has(parsed.hostname)) {
      return DEFAULT_MEETING_URL;
    }
    return trimmed;
  } catch {
    return DEFAULT_MEETING_URL;
  }
};

export const getDefaultMeetingUrl = () => DEFAULT_MEETING_URL;

