import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit as limitConstraint,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { AppLog, AppLogType } from '@/types';

interface FetchLogsOptions {
  types?: AppLogType[];
  limit?: number;
}

export const fetchAppLogs = async (options: FetchLogsOptions = {}): Promise<AppLog[]> => {
  const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')];

  if (options.types && options.types.length > 0) {
    if (options.types.length === 1) {
      constraints.unshift(where('type', '==', options.types[0]));
    } else {
      constraints.unshift(where('type', 'in', options.types.slice(0, 10)));
    }
  }

  if (options.limit) {
    constraints.push(limitConstraint(options.limit));
  }

  const q = query(collection(db, 'appLogs'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      type: data.type,
      userId: data.userId || undefined,
      role: data.role || undefined,
      clientType: data.clientType || 'unknown',
      severity: data.severity || 'info',
      metadata: data.metadata || {},
      timestamp: data.timestamp?.toDate?.() || new Date(),
    } as AppLog;
  });
};

