// Firebaseの依存関係を削除してローカルモック専用に

// ユーザーのロール
export type UserRole = 'student' | 'instructor' | 'admin';

// ユーザー基本情報
export interface User {
  uid: string;
  userId: string; // ユーザーが設定するID
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// 講師詳細情報
export interface Instructor {
  id: string;
  userId: string;
  profileImageUrl: string;
  bio: string;
  specialties: string[];
  introVideoUrl?: string;
  slackWebhookUrl?: string;
  slackMemberId?: string;
  isActive: boolean;
  // MVP要件で追加
  meetingUrl?: string; // 面談用URL
  calendarId?: string; // GoogleカレンダーID（メールアドレスまたはカレンダーID）
  email?: string; // 講師のメールアドレス
  gender?: string; // 性別
  currentIndustry?: string; // 現在の業界
  currentOccupation?: string; // 現在の業種
  currentJobTitle?: string; // 現在の職種
  education?: Education[]; // 学歴
  workHistory?: WorkHistory[]; // 経歴
  hobbies?: string[]; // 趣味
  highSchoolClub?: string; // 高校時所属していた部活
  messageToStudents?: string; // 高校生へひとこと（100文字程度）
  createdAt: Date;
  updatedAt: Date;
}

// 生徒詳細情報
export interface StudentProfile {
  id: string;
  userId: string;
  interests: string[]; // 関心のある分野
  previousConversations: ConversationHistory[]; // 過去の会話記録
  notes?: string; // 講師用のメモ
  // MVP要件で追加
  grade?: string; // 学年
  gender?: string; // 性別
  club?: string; // 部活（あれば）
  hobbies?: string[]; // 趣味、好きなこと
  createdAt: Date;
  updatedAt: Date;
}

// 会話記録
export interface ConversationHistory {
  date: Date;
  instructorId: string;
  instructorName: string;
  summary: string; // 面談内容の要約
  topics: string[]; // 話したトピック
  nextSteps?: string; // 次のステップ
}

// 学歴情報
export interface Education {
  school: string; // 学校名
  degree?: string; // 学位
  field?: string; // 専攻
  graduationYear?: number; // 卒業年
}

// 経歴情報
export interface WorkHistory {
  company: string; // 会社名
  industry: string; // 業界
  occupation: string; // 業種
  jobTitle: string; // 職種
  startYear?: number; // 開始年
  endYear?: number; // 終了年
}

// 空き時間枠
export interface AvailableSlot {
  id: string;
  instructorId: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  createdAt: Date;
}

// 予約ステータス
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

// セッションタイプ
export type SessionType = 'one-time' | 'recurring';

// 予約情報
export interface Booking {
  id: string;
  instructorId: string;
  studentId: string;
  slotId: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  notes?: string;
  status: BookingStatus;
  // MVP要件で追加
  sessionType?: SessionType; // 単発 or 定例
  questionsBeforeSession?: string[]; // 事前に記入した聞きたいことリスト（単発の場合）
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  meetingUrl?: string;
  consultationText?: string;
  // Googleカレンダー連携
  googleCalendarEventId?: string;
  googleCalendarLink?: string;
}

// 講師と講師詳細を結合したデータ
export interface InstructorWithUser extends Instructor {
  user: User;
}

// 予約と関連データを結合したデータ
export interface BookingWithDetails extends Booking {
  instructor: InstructorWithUser;
  student: User;
}

// フォーム用の型定義
export interface LoginFormData {
  userId: string;
  password: string;
}

export interface RegisterFormData {
  userId: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: UserRole;
}

export interface BookingFormData {
  purpose: string;
  notes?: string;
}

export interface AvailabilityFormData {
  date: string;
  startTime: string;
  endTime: string;
}

export interface InstructorProfileFormData {
  displayName: string;
  bio: string;
  specialties: string[];
  profileImageUrl?: string;
  introVideoUrl?: string;
  // MVP要件で追加
  meetingUrl?: string;
  gender?: string;
  currentIndustry?: string;
  currentOccupation?: string;
  currentJobTitle?: string;
  education?: Education[];
  workHistory?: WorkHistory[];
  hobbies?: string[];
  highSchoolClub?: string;
  messageToStudents?: string;
}

// 通知情報
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'cancellation' | 'reminder' | 'system';
  bookingId?: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 認証コンテキスト用
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userId: string, password: string) => Promise<void>;
  signUp: (userId: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

