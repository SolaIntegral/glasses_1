'use client';

import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { AppLogSeverity, AppLogType, UserRole } from '@/types';

const LOG_COLLECTION = 'appLogs';

type ClientType = 'web' | 'ios' | 'android' | 'unknown';

interface LogOptions {
  userId?: string;
  role?: UserRole;
  clientType?: ClientType;
  severity?: AppLogSeverity;
  metadata?: Record<string, any>;
}

const detectClientType = (): ClientType => {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    return 'ios';
  }
  if (ua.includes('android')) {
    return 'android';
  }
  return 'web';
};

export const logAppEvent = async (type: AppLogType, options: LogOptions = {}) => {
  try {
    const payload = {
      type,
      userId: options.userId || null,
      role: options.role || null,
      clientType: options.clientType || detectClientType(),
      severity: options.severity || 'info',
      metadata: options.metadata || {},
      timestamp: Timestamp.now(),
    };

    await addDoc(collection(db, LOG_COLLECTION), payload);
  } catch (error) {
    console.error('Failed to write app log:', error);
  }
};

