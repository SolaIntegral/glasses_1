import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { Timestamp } from 'firebase/firestore';

export interface StudentReservationStatus {
  userId: string;
  displayName: string;
  hasUpcoming: boolean;
  nextBookingDate?: Date;
  lastBookingDate?: Date;
  upcomingCount: number;
  totalBookings: number;
}

export interface InstructorAvailabilityStatus {
  instructorId: string;
  displayName: string;
  availableSlotCount: number;
  nextAvailableDate?: Date;
  lastUpdatedAt?: Date;
}

const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return undefined;
};

export const getStudentReservationStatus = async (): Promise<StudentReservationStatus[]> => {
  const now = new Date();

  const studentsSnapshot = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'student'))
  );

  const bookingsSnapshot = await getDocs(collection(db, 'bookings'));

  const bookingsByStudent = new Map<
    string,
    {
      upcoming: Date[];
      all: Date[];
    }
  >();

  bookingsSnapshot.forEach((doc) => {
    const data = doc.data();
    const studentId = data.studentId as string | undefined;
    if (!studentId) return;

    const startTime = toDate(data.startTime);
    if (!startTime) return;

    const status = data.status as string | undefined;
    if (status === 'cancelled') {
      return;
    }

    if (!bookingsByStudent.has(studentId)) {
      bookingsByStudent.set(studentId, { upcoming: [], all: [] });
    }

    const bucket = bookingsByStudent.get(studentId)!;
    bucket.all.push(startTime);

    if (status === 'confirmed' && startTime >= now) {
      bucket.upcoming.push(startTime);
    }
  });

  const result: StudentReservationStatus[] = studentsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const studentId = doc.id;
    const displayName = data.displayName || studentId;
    const bucket = bookingsByStudent.get(studentId) || { upcoming: [], all: [] };

    const upcomingSorted = bucket.upcoming.sort((a, b) => a.getTime() - b.getTime());
    const allSorted = bucket.all.sort((a, b) => a.getTime() - b.getTime());

    return {
      userId: studentId,
      displayName,
      hasUpcoming: upcomingSorted.length > 0,
      nextBookingDate: upcomingSorted[0],
      lastBookingDate: allSorted[allSorted.length - 1],
      upcomingCount: upcomingSorted.length,
      totalBookings: allSorted.length,
    };
  });

  result.sort((a, b) => {
    if (a.hasUpcoming === b.hasUpcoming) {
      return a.displayName.localeCompare(b.displayName, 'ja');
    }
    return a.hasUpcoming ? 1 : -1;
  });

  return result;
};

export const getInstructorAvailabilityStatus = async (): Promise<InstructorAvailabilityStatus[]> => {
  const now = new Date();

  const instructorsSnapshot = await getDocs(collection(db, 'instructors'));
  const instructorUsersSnapshot = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'instructor'))
  );
  const availableSlotsSnapshot = await getDocs(collection(db, 'availableSlots'));

  const instructorNames = new Map<string, string>();
  instructorUsersSnapshot.forEach((doc) => {
    const data = doc.data();
    instructorNames.set(doc.id, data.displayName || doc.id);
  });

  const slotBucket = new Map<
    string,
    {
      slots: Date[];
      lastUpdated?: Date;
    }
  >();

  availableSlotsSnapshot.forEach((doc) => {
    const data = doc.data();
    const instructorId = data.instructorId as string | undefined;
    if (!instructorId) return;

    const startTime = toDate(data.startTime);
    if (!startTime) return;
    const isBooked = data.isBooked;

    if (!slotBucket.has(instructorId)) {
      slotBucket.set(instructorId, { slots: [], lastUpdated: undefined });
    }

    const bucket = slotBucket.get(instructorId)!;
    const updatedAt = toDate(data.updatedAt);
    if (!bucket.lastUpdated || (updatedAt && updatedAt > bucket.lastUpdated)) {
      bucket.lastUpdated = updatedAt;
    }

    if (!isBooked && startTime >= now) {
      bucket.slots.push(startTime);
    }
  });

  const statuses: InstructorAvailabilityStatus[] = instructorsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const instructorId = data.userId || doc.id;
    const displayName =
      instructorNames.get(instructorId) || data.displayName || instructorId;
    const bucket = slotBucket.get(instructorId) || { slots: [], lastUpdated: undefined };

    const sortedSlots = bucket.slots.sort((a, b) => a.getTime() - b.getTime());

    return {
      instructorId,
      displayName,
      availableSlotCount: sortedSlots.length,
      nextAvailableDate: sortedSlots[0],
      lastUpdatedAt: bucket.lastUpdated,
    };
  });

  statuses.sort((a, b) => {
    if (a.availableSlotCount === b.availableSlotCount) {
      return a.displayName.localeCompare(b.displayName, 'ja');
    }
    return a.availableSlotCount - b.availableSlotCount;
  });

  return statuses;
};

