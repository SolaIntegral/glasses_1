'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { fetchAppLogs } from '@/lib/firebase/logs';
import {
  getInstructorAvailabilityStatus,
  getStudentReservationStatus,
  InstructorAvailabilityStatus,
  StudentReservationStatus,
} from '@/lib/firebase/monitoring';
import { AppLog, AppLogType } from '@/types';
import Loading from '@/components/ui/Loading';

type TabKey = 'auth' | 'profile' | 'system' | 'reservation';

interface TabConfig {
  key: TabKey;
  label: string;
  description: string;
  kind: 'logs' | 'report';
  types?: AppLogType[];
}

const TABS: TabConfig[] = [
  {
    key: 'auth',
    label: 'ログイン / ログアウト',
    description: 'ログイン処理の履歴とセッション監視ログです。',
    kind: 'logs',
    types: ['auth:signIn', 'auth:signInFailed', 'auth:signOut', 'auth:sessionChecked'],
  },
  {
    key: 'profile',
    label: 'プロフィール更新',
    description: '講師プロフィールの更新履歴です。',
    kind: 'logs',
    types: ['profile:update', 'profile:updateFailed'],
  },
  {
    key: 'system',
    label: 'システム',
    description: 'その他のシステムエラーや重要イベントを表示します。',
    kind: 'logs',
    types: ['system:error'],
  },
  {
    key: 'reservation',
    label: '予約状況',
    description:
      '生徒の予約状況と講師の空き枠を確認できます。未予約の生徒や空き枠が少ない講師を把握してください。',
    kind: 'report',
  },
];

const severityClassMap: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
};

const clientTypeLabel: Record<string, string> = {
  web: 'Web',
  ios: 'iOS',
  android: 'Android',
  unknown: '不明',
};

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>(TABS[0].key);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [studentStatus, setStudentStatus] = useState<StudentReservationStatus[]>([]);
  const [instructorStatus, setInstructorStatus] = useState<InstructorAvailabilityStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const activeConfig = TABS.find((tab) => tab.key === activeTab)!;
    const loadLogs = async () => {
      setLoading(true);
      setError('');
      try {
        if (activeConfig.kind === 'logs') {
          const data = await fetchAppLogs({
            types: activeConfig.types,
            limit: 50,
          });
          setLogs(data);
          setStudentStatus([]);
          setInstructorStatus([]);
        } else {
          const [students, instructors] = await Promise.all([
            getStudentReservationStatus(),
            getInstructorAvailabilityStatus(),
          ]);
          setStudentStatus(students);
          setInstructorStatus(instructors);
          setLogs([]);
        }
      } catch (err) {
        console.error('Failed to load logs', err);
        setError('ログの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [activeTab]);

  const activeConfig = TABS.find((tab) => tab.key === activeTab)!;

  const formatDateTime = (date?: Date) => {
    if (!date) return '-';
    return format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja });
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">ログ管理</h1>
        <p className="text-sm text-gray-600">
          システム全体のログイン状況やプロフィール更新状況を確認できます。表示件数は最新50件です。
        </p>
      </header>

      <div className="flex items-center gap-3 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
              tab.key === activeTab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500">{activeConfig.description}</p>

      {loading ? (
        <div className="py-16">
          <Loading />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : activeConfig.kind === 'logs' ? (
        logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            表示できるログがありません
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    発生時刻
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    種別
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ユーザー
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    詳細
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {format(log.timestamp, 'yyyy年MM月dd日 HH:mm:ss', { locale: ja })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          severityClassMap[log.severity] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 space-y-1">
                      <div>ユーザーID: {log.userId || '不明'}</div>
                      <div className="text-xs text-gray-500">
                        役割: {log.role || '-'} / 端末:{' '}
                        {clientTypeLabel[log.clientType || 'unknown']}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs whitespace-pre-wrap break-words">
                        {JSON.stringify(log.metadata || {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">生徒の予約状況</h2>
              {studentStatus.length === 0 ? (
                <div className="text-sm text-gray-500">生徒の情報がありません。</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          生徒
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          次回予約
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          最終予約
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          予約数
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {studentStatus.map((student) => (
                        <tr key={student.userId} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900">{student.displayName}</div>
                            <div className="text-xs text-gray-500">{student.userId}</div>
                          </td>
                          <td className="px-4 py-2">
                            {student.hasUpcoming ? (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                                予約あり
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                                未予約
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">{formatDateTime(student.nextBookingDate)}</td>
                          <td className="px-4 py-2">{formatDateTime(student.lastBookingDate)}</td>
                          <td className="px-4 py-2">
                            <div>総計: {student.totalBookings}件</div>
                            <div className="text-xs text-gray-500">
                              今後: {student.upcomingCount}件
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">講師の空き枠状況</h2>
              {instructorStatus.length === 0 ? (
                <div className="text-sm text-gray-500">講師の情報がありません。</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          講師
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          空き枠数
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          次の空き枠
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                          最終更新
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {instructorStatus.map((instructor) => (
                        <tr key={instructor.instructorId} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900">
                              {instructor.displayName}
                            </div>
                            <div className="text-xs text-gray-500">{instructor.instructorId}</div>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                instructor.availableSlotCount === 0
                                  ? 'bg-red-100 text-red-700'
                                  : instructor.availableSlotCount < 3
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {instructor.availableSlotCount}件
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {formatDateTime(instructor.nextAvailableDate)}
                          </td>
                          <td className="px-4 py-2">
                            {formatDateTime(instructor.lastUpdatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

