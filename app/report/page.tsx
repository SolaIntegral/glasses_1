'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ReportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 未ログインユーザーはリダイレクト
  useEffect(() => {
    if (!loading && mounted && !user) {
      router.push('/auth/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, mounted, user]);

  if (loading || !mounted || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
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
            <h1 className="text-lg font-semibold text-gray-900">運営への通報</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">通報フォーム</h2>
          
          <p className="text-gray-600 mb-6">
            不適切な行動や違反行為を発見した場合、以下のフォームから運営に報告してください。
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">通報内容</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>不適切な言動や行為</li>
              <li>個人情報の無断公開</li>
              <li>迷惑行為や嫌がらせ</li>
              <li>その他、利用規約に反する行為</li>
            </ul>
          </div>

          <a
            href="https://forms.gle/YOUR_REPORT_FORM_ID"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold text-center hover:bg-red-700 transition-colors mb-4"
          >
            通報フォームを開く
          </a>

          <p className="text-xs text-gray-500 text-center">
            ※ Google Formが新しいタブで開きます
          </p>
        </div>

        {/* 利用規約へのリンク */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-2">利用規約</h3>
          <p className="text-sm text-gray-600 mb-4">
            詳細については、利用規約をご確認ください。
          </p>
          <Link
            href="/terms"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            利用規約を確認する →
          </Link>
        </div>
      </div>
    </div>
  );
}

