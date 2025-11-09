'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getInstructorWithUser } from '@/lib/firebase/instructors';
import { getAvailableSlotsByInstructor } from '@/lib/firebase/availability';
import { createBooking } from '@/lib/firebase/bookings';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Loading from '@/components/ui/Loading';
import { Suspense } from 'react';
import { Education, WorkHistory, SessionType } from '@/types';

function InstructorDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instructorId = searchParams.get('id');
  const { user } = useAuth();
  
  const [instructor, setInstructor] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [sessionType, setSessionType] = useState<SessionType>('recurring');
  const [consultationText, setConsultationText] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const getDrivePreviewUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('drive.google.com')) {
        const match = parsed.pathname.match(/\/file\/d\/([^/]+)/);
        if (match) {
          return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
      }
    } catch (e) {
      console.warn('Failed to parse intro video url', e);
    }
    return null;
  };

  useEffect(() => {
    if (instructorId && user) {
      const fetchData = async () => {
        await fetchInstructorDetail();
        await fetchAvailableSlots();
      };
      fetchData();
    }
  }, [instructorId, user]);

  const fetchInstructorDetail = async () => {
    if (!instructorId) return;
    
    try {
      const instructorData = await getInstructorWithUser(instructorId);
      
      if (instructorData) {
        setInstructor(instructorData);
      }
    } catch (err) {
      console.error('Error fetching instructor:', err);
      setError('講師情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!instructorId) return;
    
    try {
      const slots = await getAvailableSlotsByInstructor(instructorId);
      
      // 全てのスロットを取得（過去のものも含む）
      // 過去のものは表示するが、灰色にして無効化する
      const maxBookingDate = new Date();
      maxBookingDate.setDate(maxBookingDate.getDate() + 14); // 2週間後まで
      
      const allSlots = slots.filter(slot => {
        const slotStartTime = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
        // 2週間以内 かつ 予約されていない
        return slotStartTime <= maxBookingDate && !slot.isBooked;
      });
      
      setAvailableSlots(allSlots);
    } catch (err) {
      console.error('Error fetching available slots:', err);
    }
  };

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !user || !instructorId) {
      setError('予約情報が不正です');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const bookingId = await createBooking(
        instructorId,
        user.uid,
        selectedSlot.id,
        selectedSlot.startTime,
        selectedSlot.endTime,
        consultationText.trim() || '面談',
        consultationText.trim() || undefined,
        sessionType,
        sessionType === 'one-time' && consultationText ? [consultationText] : undefined
      );

      router.push(`/student/booking-complete?bookingId=${bookingId}`);
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || '予約の作成に失敗しました');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">講師情報が見つかりません</p>
          <button
            onClick={() => router.push('/student/instructors')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">講師詳細</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* 講師情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {instructor.profileImageUrl ? (
                <img
                  src={instructor.profileImageUrl}
                  alt={instructor.user?.displayName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl">👨‍🏫</span>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {instructor.user?.displayName}
              </h2>
              
              {instructor.specialties && instructor.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {instructor.specialties.map((specialty: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {instructor.bio && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">プロフィール</h3>
              <p className="text-gray-600">{instructor.bio}</p>
            </div>
          )}

          {/* 現在の所属 */}
          {(instructor.currentIndustry || instructor.currentOccupation || instructor.currentJobTitle) && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">現在の所属</h3>
              <div className="text-gray-600">
                {instructor.currentIndustry && <p>業界: {instructor.currentIndustry}</p>}
                {instructor.currentOccupation && <p>業種: {instructor.currentOccupation}</p>}
                {instructor.currentJobTitle && <p>職種: {instructor.currentJobTitle}</p>}
              </div>
            </div>
          )}

          {/* 学歴 */}
          {instructor.education && instructor.education.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">学歴</h3>
              <div className="space-y-2">
                {instructor.education.map((edu: Education, index: number) => (
                  <div key={index} className="text-gray-600">
                    <p className="font-medium">{edu.school}</p>
                    {edu.degree && <p className="text-sm">学位: {edu.degree}</p>}
                    {edu.field && <p className="text-sm">専攻: {edu.field}</p>}
                    {edu.graduationYear && <p className="text-sm">卒業年: {edu.graduationYear}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 経歴 */}
          {instructor.workHistory && instructor.workHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">経歴</h3>
              <div className="space-y-2">
                {instructor.workHistory.map((work: WorkHistory, index: number) => (
                  <div key={index} className="text-gray-600">
                    <p className="font-medium">{work.company}</p>
                    <p className="text-sm">{work.industry} / {work.occupation} / {work.jobTitle}</p>
                    {(work.startYear || work.endYear) && (
                      <p className="text-sm">
                        {work.startYear || '?'} 年 〜 {work.endYear ? `${work.endYear}年` : '現在'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 趣味 */}
          {instructor.hobbies && instructor.hobbies.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">趣味</h3>
              <div className="flex flex-wrap gap-2">
                {instructor.hobbies.map((hobby: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 高校時の部活 */}
          {instructor.highSchoolClub && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">高校時の部活</h3>
              <p className="text-gray-600">{instructor.highSchoolClub}</p>
            </div>
          )}

          {/* 高校生へひとこと */}
          {instructor.messageToStudents && (
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">高校生へひとこと</h3>
              <p className="text-gray-700">{instructor.messageToStudents}</p>
            </div>
          )}
        </div>

        {instructor.introVideoUrl && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">自己紹介動画</h3>
            <div className="space-y-4">
              {(() => {
                const previewUrl = getDrivePreviewUrl(instructor.introVideoUrl);
                if (previewUrl) {
                  return (
                    <div className="aspect-video w-full bg-black/5 rounded-lg overflow-hidden">
                      <iframe
                        src={previewUrl}
                        className="w-full h-full"
                        allow="autoplay"
                        allowFullScreen
                        loading="lazy"
                        title="自己紹介動画"
                      />
                    </div>
                  );
                }
                return null;
              })()}
              <a
                href={instructor.introVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                動画を開く
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H7" />
                </svg>
              </a>
              <p className="text-xs text-gray-500">動画は新しいタブでGoogle Driveが開きます。</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {/* 空き時間枠 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">空き時間</h3>
          
          {availableSlots.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              現在、空き時間がありません
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableSlots.map((slot) => {
                const slotStartTime = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
                const now = new Date();
                const isPast = slotStartTime <= now;
                const hoursDiff = (slotStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                // 2時間前を過ぎている場合は選択不可（時間が過ぎていない場合も含む）
                const isSelectable = !isPast && hoursDiff >= 2;
                
                return (
                  <button
                    key={slot.id}
                    onClick={() => isSelectable && handleSelectSlot(slot)}
                    disabled={!isSelectable}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      !isSelectable
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                        : selectedSlot?.id === slot.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${!isSelectable ? 'text-gray-400' : 'text-gray-900'}`}>
                          {format(slotStartTime, 'yyyy年MM月dd日(E)', { locale: ja })}
                        </p>
                        <p className={`text-sm mt-1 ${!isSelectable ? 'text-gray-400' : 'text-gray-600'}`}>
                          {format(slotStartTime, 'HH:mm', { locale: ja })} - {format(slot.endTime instanceof Date ? slot.endTime : new Date(slot.endTime), 'HH:mm', { locale: ja })}
                        </p>
                        {!isSelectable && (
                          <p className="text-xs text-gray-400 mt-1">
                            {isPast ? '時間が過ぎています' : '2時間前までに予約してください'}
                          </p>
                        )}
                      </div>
                      {selectedSlot?.id === slot.id && isSelectable && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 予約フォーム（スロット選択時のみ表示） */}
        {selectedSlot && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">予約情報</h3>
            
            {/* 選択されたスロット情報 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">選択した日時</p>
              <p className="text-gray-900">
                {format(selectedSlot.startTime instanceof Date ? selectedSlot.startTime : new Date(selectedSlot.startTime), 'yyyy年MM月dd日(E) HH:mm', { locale: ja })} - {format(selectedSlot.endTime instanceof Date ? selectedSlot.endTime : new Date(selectedSlot.endTime), 'HH:mm', { locale: ja })}
              </p>
            </div>

            {/* セッションタイプ */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">セッションタイプ</h4>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    type="radio"
                    name="sessionType"
                    value="one-time"
                    checked={sessionType === 'one-time'}
                    onChange={(e) => setSessionType(e.target.value as SessionType)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">単発</div>
                    <div className="text-sm text-gray-600">今回限りのセッション</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    type="radio"
                    name="sessionType"
                    value="recurring"
                    checked={sessionType === 'recurring'}
                    onChange={(e) => setSessionType(e.target.value as SessionType)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">定例</div>
                    <div className="text-sm text-gray-600">継続的なセッション</div>
                  </div>
                </label>
              </div>
            </div>

            {/* 相談したいこと */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">事前に聞きたいこと（任意）</h4>
              <textarea
                value={consultationText}
                onChange={(e) => setConsultationText(e.target.value)}
                placeholder="事前に伝えておきたい内容があればご記入ください"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-500 mt-2">
                {consultationText.length}/500文字
              </div>
            </div>

            {/* 予約確定ボタン */}
            <button
              onClick={handleConfirmBooking}
              disabled={booking}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {booking ? '予約中...' : '予約を確定する'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InstructorDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InstructorDetailContent />
    </Suspense>
  );
}
