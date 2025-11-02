# 🚀 開発スタートガイド

## 📖 このドキュメントについて

このガイドは、予約システムの開発を今すぐ始めるための最短パスを提供します。

---

## 📚 ドキュメント一覧

プロジェクトには以下のドキュメントがあります：

1. **REQUIREMENTS.md** - 要件定義書
   - システム概要と確定した要件
   - 機能一覧

2. **ARCHITECTURE.md** - アーキテクチャ設計書
   - システム全体図
   - ER図
   - フロー図
   - コンポーネント構成

3. **IMPLEMENTATION_PLAN.md** - 実装計画書
   - 技術スタック詳細
   - データベース設計
   - コード例

4. **LOCAL_SETUP_GUIDE.md** - ローカル環境セットアップ
   - 詳細なセットアップ手順
   - Firebase Emulator設定
   - 動作確認方法

5. **GETTING_STARTED.md**（このファイル） - クイックスタート

---

## ⚡ クイックスタート（5分で開始）

### Step 1: 必要なソフトウェアの確認

```bash
# Node.js（v18以上）
node --version

# npm
npm --version

# Java（Firebase Emulator用）
java --version

# Git
git --version
```

**まだインストールしていない場合:**
- Node.js: https://nodejs.org/
- Java: https://www.oracle.com/java/technologies/downloads/
- Git: https://git-scm.com/

### Step 2: プロジェクトセットアップ

```bash
cd /Users/sora/develop/glasses_1

# Next.jsプロジェクト作成
npx create-next-app@latest . --typescript --tailwind --app

# 必要なパッケージをインストール
npm install firebase firebase-admin firebase-functions
npm install react-hook-form zod @hookform/resolvers
npm install react-big-calendar date-fns
npm install lucide-react clsx tailwind-merge

# 開発ツール
npm install -D firebase-tools @types/react-big-calendar

# Firebase CLIをグローバルインストール
npm install -g firebase-tools
```

### Step 3: Firebaseプロジェクト初期化

```bash
# Firebaseにログイン（スキップ可能）
firebase login

# プロジェクト初期化
firebase init

# 選択項目:
# - Firestore
# - Functions
# - Hosting
# - Emulators (全て選択)
```

### Step 4: 環境変数の設定

`.env.local` を作成:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="demo-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="demo-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="demo-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="demo-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

### Step 5: 起動

**ターミナル1（Firebase Emulator）:**
```bash
firebase emulators:start --export-on-exit
```

**ターミナル2（Next.js）:**
```bash
npm run dev
```

**アクセス:**
- アプリ: http://localhost:3000
- Emulator UI: http://localhost:4000

---

## 🗺️ 開発ロードマップ

### Week 1-2: 基盤構築
- [x] 要件定義完了
- [x] アーキテクチャ設計完了
- [ ] プロジェクトセットアップ
- [ ] Firebase Emulator設定
- [ ] 基本レイアウト作成

### Week 3: 認証機能
- [ ] ログイン画面
- [ ] 新規登録画面
- [ ] 認証状態管理
- [ ] ロール別リダイレクト

### Week 4: 講師管理
- [ ] 講師一覧表示
- [ ] 講師詳細表示
- [ ] プロフィール編集（講師用）

### Week 5: 予約機能（生徒側）
- [ ] カレンダー表示
- [ ] 空き時間選択
- [ ] 予約フォーム
- [ ] 24時間前チェック
- [ ] 予約確定

### Week 6: 空き時間管理（講師側）
- [ ] 空き時間登録
- [ ] カレンダー表示
- [ ] 一括登録機能

### Week 7: キャンセル機能
- [ ] キャンセルボタン実装
- [ ] 24時間前チェック
- [ ] キャンセル確認モーダル
- [ ] 空き時間復元

### Week 8: 通知機能
- [ ] Cloud Functions セットアップ
- [ ] Slack通知実装
- [ ] メール通知実装
- [ ] SendGrid設定

### Week 9: テスト・改善
- [ ] ユニットテスト
- [ ] 統合テスト
- [ ] UI/UX改善
- [ ] パフォーマンス最適化

### Week 10: デプロイ
- [ ] 本番Firebase設定
- [ ] デプロイ実行
- [ ] 本番環境テスト

---

## 🎯 開発の優先順位

### Phase 1: MVP（最優先）
1. ✅ プロジェクトセットアップ
2. 🔥 認証機能（ログイン・登録）
3. 📋 講師一覧表示
4. 📅 空き時間表示
5. ✉️ 予約機能（基本）

### Phase 2: 必須機能
6. 🔔 Slack通知
7. 📧 メール通知
8. ❌ キャンセル機能
9. 👨‍🏫 講師管理画面

### Phase 3: 改善
10. 🎨 UI/UX改善
11. 🧪 テスト追加
12. 📊 分析・レポート機能

---

## 💡 開発のコツ

### 1. 小さく始める
まずは認証とデータ表示から。完璧を目指さず、動くものを作る。

### 2. Firebase Emulatorを活用
本番環境に影響せず、コストも発生しない。積極的に使う。

### 3. コンポーネント分割
再利用可能な小さなコンポーネントを作る。

### 4. 型定義を先に作る
TypeScriptの型を先に定義すると、実装がスムーズ。

### 5. Gitでこまめにコミット
機能ごとに分けてコミット。バグが出ても戻しやすい。

---

## 📂 プロジェクト構造（最終形）

```
glasses_1/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # ログイン
│   │   └── register/page.tsx       # 新規登録
│   ├── (student)/
│   │   ├── instructors/page.tsx    # 講師一覧
│   │   ├── instructors/[id]/page.tsx  # 講師詳細・予約
│   │   └── my-bookings/page.tsx    # マイ予約
│   ├── (instructor)/
│   │   ├── dashboard/page.tsx      # ダッシュボード
│   │   ├── availability/page.tsx   # 空き時間管理
│   │   ├── bookings/page.tsx       # 予約一覧
│   │   └── profile/page.tsx        # プロフィール編集
│   ├── layout.tsx
│   └── page.tsx                    # トップページ
├── components/
│   ├── ui/                         # 汎用UIコンポーネント
│   ├── auth/                       # 認証関連
│   ├── booking/                    # 予約関連
│   ├── calendar/                   # カレンダー
│   └── instructor/                 # 講師関連
├── lib/
│   ├── firebase/
│   │   └── config.ts              # Firebase設定
│   ├── auth.ts                    # 認証ロジック
│   ├── bookings.ts                # 予約ロジック
│   └── availability.ts            # 空き時間ロジック
├── hooks/
│   ├── useAuth.ts                 # 認証フック
│   └── useBookings.ts             # 予約フック
├── types/
│   └── index.ts                   # 型定義
├── functions/
│   └── src/
│       └── index.ts               # Cloud Functions
├── firebase.json
├── firestore.rules
├── .env.local
└── package.json
```

---

## 🐛 よくある問題と解決方法

### 問題1: Emulatorが起動しない
**解決:** Javaがインストールされているか確認
```bash
java --version
```

### 問題2: ポートが使用中
**解決:** ポートを解放
```bash
lsof -ti:8080 | xargs kill -9
```

### 問題3: Firebaseに接続できない
**解決:** 
1. `.env.local` を確認
2. Emulatorが起動しているか確認
3. ブラウザのコンソールでエラーを確認

### 問題4: TypeScriptエラー
**解決:** 型定義を再インストール
```bash
npm install -D @types/node @types/react @types/react-dom
```

---

## 🔗 参考リンク

### 公式ドキュメント
- [Next.js](https://nextjs.org/docs)
- [Firebase](https://firebase.google.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### チュートリアル
- [Next.js + Firebase Authentication](https://firebase.google.com/docs/auth/web/start)
- [Firestore データモデリング](https://firebase.google.com/docs/firestore/data-model)
- [Cloud Functions](https://firebase.google.com/docs/functions)

### ツール
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

## 📞 サポート

### 開発中に困ったら
1. ドキュメントを再確認
2. ブラウザのコンソールを確認
3. Firebase Emulator UIでデータを確認
4. Gitで前のバージョンに戻す

---

## 🎉 次のアクション

準備ができたら、以下の順番で進めましょう：

1. **今すぐ**: `LOCAL_SETUP_GUIDE.md` を見ながらセットアップ
2. **セットアップ後**: Firebase Emulatorの動作確認
3. **動作確認後**: 認証機能の実装開始
4. **認証完了後**: 講師一覧の実装

---

## ✨ 開発を始める準備はできましたか？

それでは、`LOCAL_SETUP_GUIDE.md` を開いて、詳細なセットアップを開始しましょう！

```bash
# 次のコマンドで開発を開始
cd /Users/sora/develop/glasses_1
npx create-next-app@latest . --typescript --tailwind --app
```

頑張ってください！🚀

