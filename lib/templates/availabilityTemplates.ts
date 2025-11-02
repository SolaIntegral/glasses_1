export interface AvailabilityTemplate {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  icon: string;
  category: 'early-morning' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'custom';
  isPopular: boolean;
}

export const defaultTemplates: AvailabilityTemplate[] = [
  {
    id: 'early-morning',
    name: '早朝',
    description: '06:00 - 08:00',
    startTime: '06:00',
    endTime: '08:00',
    icon: '🌅',
    category: 'early-morning',
    isPopular: true
  },
  {
    id: 'morning-short',
    name: '朝の短時間',
    description: '08:00 - 09:00',
    startTime: '08:00',
    endTime: '09:00',
    icon: '☀️',
    category: 'morning',
    isPopular: true
  },
  {
    id: 'lunch-time',
    name: '昼休み',
    description: '12:00 - 13:00',
    startTime: '12:00',
    endTime: '13:00',
    icon: '🍽️',
    category: 'lunch',
    isPopular: true
  },
  {
    id: 'after-work',
    name: '仕事終わり',
    description: '18:00 - 20:00',
    startTime: '18:00',
    endTime: '20:00',
    icon: '🌆',
    category: 'evening',
    isPopular: true
  },
  {
    id: 'night-short',
    name: '夜の短時間',
    description: '20:00 - 21:00',
    startTime: '20:00',
    endTime: '21:00',
    icon: '🌙',
    category: 'night',
    isPopular: false
  },
  {
    id: 'late-night',
    name: '深夜',
    description: '21:00 - 23:00',
    startTime: '21:00',
    endTime: '23:00',
    icon: '🌃',
    category: 'night',
    isPopular: false
  },
  {
    id: 'weekend-morning',
    name: '週末午前',
    description: '09:00 - 12:00',
    startTime: '09:00',
    endTime: '12:00',
    icon: '🏖️',
    category: 'morning',
    isPopular: true
  },
  {
    id: 'weekend-afternoon',
    name: '週末午後',
    description: '13:00 - 17:00',
    startTime: '13:00',
    endTime: '17:00',
    icon: '🎯',
    category: 'afternoon',
    isPopular: true
  }
];

export interface UserAvailabilitySettings {
  userId: string;
  preferredTemplates: string[];
  customTemplates: AvailabilityTemplate[];
  workSchedule: {
    workDays: number[]; // 0-6 (日-土)
    workStartTime: string;
    workEndTime: string;
  };
}

export const getUserAvailabilitySettings = (userId: string): UserAvailabilitySettings | null => {
  if (typeof window === 'undefined') return null;
  
  const settings = localStorage.getItem(`user_availability_settings_${userId}`);
  return settings ? JSON.parse(settings) : null;
};

export const saveUserAvailabilitySettings = (settings: UserAvailabilitySettings): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(`user_availability_settings_${settings.userId}`, JSON.stringify(settings));
};

export const getDefaultSettings = (userId: string): UserAvailabilitySettings => {
  return {
    userId,
    preferredTemplates: ['early-morning', 'lunch-time', 'after-work'],
    customTemplates: [],
    workSchedule: {
      workDays: [1, 2, 3, 4, 5], // 月〜金
      workStartTime: '09:00',
      workEndTime: '18:00'
    }
  };
};

export const createCustomTemplate = (
  name: string,
  startTime: string,
  endTime: string,
  icon: string = '⏰'
): AvailabilityTemplate => {
  return {
    id: `custom_${Date.now()}`,
    name,
    description: `${startTime} - ${endTime}`,
    startTime,
    endTime,
    icon,
    category: 'custom',
    isPopular: false
  };
};

export const getRecommendedTemplates = (workSchedule: UserAvailabilitySettings['workSchedule']): AvailabilityTemplate[] => {
  const recommended: AvailabilityTemplate[] = [];
  
  // 仕事前の時間
  const workStartHour = parseInt(workSchedule.workStartTime.split(':')[0]);
  if (workStartHour >= 7) {
    recommended.push({
      id: 'pre-work',
      name: '出勤前',
      description: `${String(workStartHour - 2).padStart(2, '0')}:00 - ${workSchedule.workStartTime}`,
      startTime: `${String(workStartHour - 2).padStart(2, '0')}:00`,
      endTime: workSchedule.workStartTime,
      icon: '🌅',
      category: 'early-morning',
      isPopular: true
    });
  }
  
  // 昼休み
  recommended.push({
    id: 'lunch-break',
    name: '昼休み',
    description: '12:00 - 13:00',
    startTime: '12:00',
    endTime: '13:00',
    icon: '🍽️',
    category: 'lunch',
    isPopular: true
  });
  
  // 仕事後
  const workEndHour = parseInt(workSchedule.workEndTime.split(':')[0]);
  recommended.push({
    id: 'after-work',
    name: '仕事終わり',
    description: `${workSchedule.workEndTime} - ${String(workEndHour + 2).padStart(2, '0')}:00`,
    startTime: workSchedule.workEndTime,
    endTime: `${String(workEndHour + 2).padStart(2, '0')}:00`,
    icon: '🌆',
    category: 'evening',
    isPopular: true
  });
  
  return recommended;
};
