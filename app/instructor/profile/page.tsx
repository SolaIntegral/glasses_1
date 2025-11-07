'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getInstructor, getInstructorByDocId, updateInstructor } from '@/lib/firebase/instructors';
import { Instructor, Education, WorkHistory } from '@/types';
import Loading from '@/components/ui/Loading';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

function InstructorProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [bio, setBio] = useState('');
  // MVP要件で追加
  const [meetingUrl, setMeetingUrl] = useState('');
  const [gender, setGender] = useState('');
  const [currentIndustry, setCurrentIndustry] = useState('');
  const [currentOccupation, setCurrentOccupation] = useState('');
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [highSchoolClub, setHighSchoolClub] = useState('');
  const [messageToStudents, setMessageToStudents] = useState('');
  const [education, setEducation] = useState<Education[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    // URLパラメータを確認
    const admin = searchParams.get('admin');
    const uid = searchParams.get('uid');
    const instructorDocId = searchParams.get('instructorDocId');
    
    if (admin === 'true' && uid) {
      setIsAdminMode(true);
      setTargetUserId(uid);
      // instructorDocIdも保持（必要に応じて使用）
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchInstructor = async () => {
      console.log('fetchInstructor called - isAdminMode:', isAdminMode, 'targetUserId:', targetUserId, 'user:', user?.uid);
      
      if (isAdminMode && targetUserId) {
        console.log('Fetching in admin mode');
        try {
          const instructorData = await getInstructor(targetUserId);
          console.log('Admin instructorData:', instructorData);
          const userDoc = await getDoc(doc(db, 'users', targetUserId));
          const userData = userDoc.data();
          
          if (instructorData) {
            setInstructor(instructorData);
            setDisplayName(userData?.displayName || '');
            setSpecialties(instructorData.specialties?.join(', ') || '');
            setBio(instructorData.bio || '');
            setMeetingUrl(instructorData.meetingUrl || '');
            setGender(instructorData.gender || '');
            setCurrentIndustry(instructorData.currentIndustry || '');
            setCurrentOccupation(instructorData.currentOccupation || '');
            setCurrentJobTitle(instructorData.currentJobTitle || '');
            setHobbies(instructorData.hobbies?.join(', ') || '');
            setHighSchoolClub(instructorData.highSchoolClub || '');
            setMessageToStudents(instructorData.messageToStudents || '');
            setEducation(instructorData.education || []);
            setWorkHistory(instructorData.workHistory || []);
          } else {
            // instructorsコレクションにデータがない場合
            console.log('Instructor data not found for admin edit');
            setDisplayName(userData?.displayName || '');
            setError('プロフィール情報が存在しません。下記フォームから作成してください。');
          }
        } catch (err) {
          console.error('Error fetching instructor:', err);
          setError('プロフィール情報の取得に失敗しました');
        } finally {
          console.log('Admin mode: setting loading to false');
          setLoading(false);
        }
        return;
      }

      if (!user) {
        console.log('No user, setting loading to false and returning');
        setLoading(false);
        return;
      }

      console.log('Fetching instructor for user:', user.uid);
      try {
        const instructorData = await getInstructor(user.uid);
        console.log('Instructor data:', instructorData);
        if (instructorData) {
          setInstructor(instructorData);
          setDisplayName(user.displayName || '');
          setSpecialties(instructorData.specialties?.join(', ') || '');
          setBio(instructorData.bio || '');
          setMeetingUrl(instructorData.meetingUrl || '');
          setGender(instructorData.gender || '');
          setCurrentIndustry(instructorData.currentIndustry || '');
          setCurrentOccupation(instructorData.currentOccupation || '');
          setCurrentJobTitle(instructorData.currentJobTitle || '');
          setHobbies(instructorData.hobbies?.join(', ') || '');
          setHighSchoolClub(instructorData.highSchoolClub || '');
          setMessageToStudents(instructorData.messageToStudents || '');
          setEducation(instructorData.education || []);
          setWorkHistory(instructorData.workHistory || []);
        } else {
          // instructorsコレクションにデータがない場合は初期データを作成
          console.log('Instructor data not found, creating initial data...');
          setDisplayName(user.displayName || '');
          setError('プロフィール情報が存在しません。下記フォームから作成してください。');
        }
      } catch (err) {
        console.error('Error fetching instructor:', err);
        setError('プロフィール情報の取得に失敗しました');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchInstructor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdminMode, targetUserId]);

  const handleSave = async () => {
    const targetId = isAdminMode && targetUserId ? targetUserId : user?.uid;
    
    if (!targetId || !instructor) {
      setError('ユーザー情報が取得できません');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const specialtiesArray = specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const hobbiesArray = hobbies
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const updatePayload: Partial<Instructor> = {
        bio,
        specialties: specialtiesArray,
        gender,
        currentIndustry,
        currentOccupation,
        currentJobTitle,
        hobbies: hobbiesArray,
        highSchoolClub,
        messageToStudents,
        education,
        workHistory,
      };

      if (isAdminMode) {
        updatePayload.meetingUrl = meetingUrl;
      }

      await updateInstructor(targetId, updatePayload);

      if (isAdminMode) {
        const userRef = doc(db, 'users', targetId);
        await updateDoc(userRef, {
          displayName,
          updatedAt: new Date()
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'プロフィールの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) {
      return;
    }

    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('ログアウトに失敗しました');
    }
  };

  const addEducation = () => {
    setEducation([...education, { school: '' }]);
  };

  const updateEducation = (index: number, data: Partial<Education>) => {
    const newEducation = [...education];
    newEducation[index] = { ...newEducation[index], ...data };
    setEducation(newEducation);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const addWorkHistory = () => {
    setWorkHistory([...workHistory, { company: '', industry: '', occupation: '', jobTitle: '' }]);
  };

  const updateWorkHistory = (index: number, data: Partial<WorkHistory>) => {
    const newWorkHistory = [...workHistory];
    newWorkHistory[index] = { ...newWorkHistory[index], ...data };
    setWorkHistory(newWorkHistory);
  };

  const removeWorkHistory = (index: number) => {
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !instructor) return;

    // 画像形式のチェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズのチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setError('画像ファイルは5MB以下にしてください');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const targetId = isAdminMode && targetUserId ? targetUserId : user?.uid;
      if (!targetId) {
        throw new Error('ユーザー情報が取得できません');
      }

      // 古い画像を削除（URLからパスを抽出）
      if (instructor.profileImageUrl) {
        try {
          // URLからパスを抽出: https://firebasestorage.../o/instructor-profiles%2F... -> instructor-profiles/...
          const urlObj = new URL(instructor.profileImageUrl);
          const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
          if (pathMatch) {
            const decodedPath = decodeURIComponent(pathMatch[1]);
            const oldImageRef = ref(storage, decodedPath);
            await deleteObject(oldImageRef);
          }
        } catch (err) {
          console.error('Failed to delete old image:', err);
          // 削除に失敗しても続行
        }
      }

      // 新しい画像をアップロード
      const imageRef = ref(storage, `instructor-profiles/${targetId}/${Date.now()}-${file.name}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);

      // Firestoreに保存
      await updateInstructor(targetId, {
        profileImageUrl: downloadURL,
      });

      // ローカル状態を更新
      setInstructor({
        ...instructor,
        profileImageUrl: downloadURL,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || '画像のアップロードに失敗しました');
    } finally {
      setUploadingImage(false);
      // ファイル入力のクリア
      e.target.value = '';
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">講師情報を取得できませんでした</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isAdminMode ? '講師プロフィール編集' : 'プロフィールと設定'}
            </h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* プロフィール写真 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              {instructor?.profileImageUrl ? (
                <img
                  src={instructor.profileImageUrl}
                  alt="プロフィール"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors cursor-pointer">
              {uploadingImage ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  アップロード中...
                </span>
              ) : (
                '写真を変更する'
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
          </div>
        </div>

        {/* プロフィール情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">講師名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田 太郎"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">面談用URL</label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isAdminMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                disabled={!isAdminMode}
              />
              {!isAdminMode && (
                <p className="mt-2 text-xs text-gray-500">面談用URLの変更は管理者が行います。変更が必要な場合は事務局へご連絡ください。</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                専門分野タグ
                <span className="text-xs text-gray-500 ml-2">（カンマ区切りで入力）</span>
              </label>
              <input
                type="text"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Web開発, マーケティング, デザイン"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介・経歴</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="自己紹介や経歴を入力してください"
              />
            </div>
          </div>
        </div>

        {/* 現在の所属 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">現在の所属</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">業界</label>
              <input
                type="text"
                value={currentIndustry}
                onChange={(e) => setCurrentIndustry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="IT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">業種</label>
              <input
                type="text"
                value={currentOccupation}
                onChange={(e) => setCurrentOccupation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Webサービス"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">職種</label>
              <input
                type="text"
                value={currentJobTitle}
                onChange={(e) => setCurrentJobTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="エンジニア"
              />
            </div>
          </div>
        </div>

        {/* 学歴 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">学歴</h2>
            <button
              onClick={addEducation}
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
            >
              + 追加
            </button>
          </div>
          
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">学歴 {index + 1}</span>
                  <button
                    onClick={() => removeEducation(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    削除
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">学校名</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEducation(index, { school: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="〇〇大学"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">学位</label>
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => updateEducation(index, { degree: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="学士"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">専攻</label>
                    <input
                      type="text"
                      value={edu.field || ''}
                      onChange={(e) => updateEducation(index, { field: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="情報工学科"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">卒業年</label>
                    <input
                      type="number"
                      value={edu.graduationYear || ''}
                      onChange={(e) => updateEducation(index, { graduationYear: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="2020"
                    />
                  </div>
                </div>
              </div>
            ))}
            {education.length === 0 && (
              <p className="text-gray-500 text-center py-4">学歴を追加してください</p>
            )}
          </div>
        </div>

        {/* 経歴 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">経歴</h2>
            <button
              onClick={addWorkHistory}
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
            >
              + 追加
            </button>
          </div>
          
          <div className="space-y-4">
            {workHistory.map((work, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">経歴 {index + 1}</span>
                  <button
                    onClick={() => removeWorkHistory(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    削除
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">会社名</label>
                    <input
                      type="text"
                      value={work.company}
                      onChange={(e) => updateWorkHistory(index, { company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="〇〇株式会社"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">業界</label>
                    <input
                      type="text"
                      value={work.industry}
                      onChange={(e) => updateWorkHistory(index, { industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="IT"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">業種</label>
                    <input
                      type="text"
                      value={work.occupation}
                      onChange={(e) => updateWorkHistory(index, { occupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Webサービス"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">職種</label>
                    <input
                      type="text"
                      value={work.jobTitle}
                      onChange={(e) => updateWorkHistory(index, { jobTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="エンジニア"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">開始年</label>
                    <input
                      type="number"
                      value={work.startYear || ''}
                      onChange={(e) => updateWorkHistory(index, { startYear: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="2015"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">終了年</label>
                    <input
                      type="number"
                      value={work.endYear || ''}
                      onChange={(e) => updateWorkHistory(index, { endYear: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="2020（現在も在籍中なら空欄）"
                    />
                  </div>
                </div>
              </div>
            ))}
            {workHistory.length === 0 && (
              <p className="text-gray-500 text-center py-4">経歴を追加してください</p>
            )}
          </div>
        </div>

        {/* 趣味・部活 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">趣味・部活</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                趣味
                <span className="text-xs text-gray-500 ml-2">（カンマ区切りで入力）</span>
              </label>
              <input
                type="text"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="読書, 映画鑑賞, 料理"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">高校時所属していた部活（あれば）</label>
              <input
                type="text"
                value={highSchoolClub}
                onChange={(e) => setHighSchoolClub(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="野球部"
              />
            </div>
          </div>
        </div>

        {/* 高校生へひとこと */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">高校生へひとこと</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ（100文字程度）
            </label>
            <textarea
              value={messageToStudents}
              onChange={(e) => setMessageToStudents(e.target.value)}
              rows={4}
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="高校生へのメッセージを入力してください"
            />
            <p className="text-xs text-gray-500 mt-1">{messageToStudents.length}/100文字</p>
          </div>
        </div>

        {/* エラー・成功メッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 text-sm">
            プロフィールを保存しました
          </div>
        )}

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-6"
        >
          {saving ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              保存中...
            </div>
          ) : (
            'プロフィールを保存する'
          )}
        </button>

        {/* Slack通知設定 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Slack通知設定</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium text-gray-900">ステータス</div>
              <div className="text-sm text-gray-600">未連携</div>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              Slackと連携する
            </button>
          </div>
        </div>


        {/* ログアウト（管理者モードでは表示しない） */}
        {!isAdminMode && (
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-red-700 transition-colors"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InstructorProfilePage() {
  return (
    <Suspense fallback={<Loading />}>
      <InstructorProfileContent />
    </Suspense>
  );
}
