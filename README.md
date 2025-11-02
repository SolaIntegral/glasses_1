# Glasses - 予約システム

本番環境URL: **https://glasses1-582eb.web.app**

## 📊 MVP実装進捗

**実装完了**: 17/18 必須項目（94%完了） ✅

**テスト**: `docs/TEST_CHECKLIST.md` を参照

**詳細**: `docs/MVP_CHECKLIST.md` を参照

**ドキュメント一覧**:
- 📋 **セットアップガイド**: `docs/setup/` ディレクトリ
  - `docs/setup/GAS_SETUP_GUIDE.md` ⭐ - Slack通知の設定（まずこれから！）
  - `docs/FIREBASE_STORAGE_SETUP_INSTRUCTIONS.md` ⭐ - 画像アップロード設定（重要！）
  - `docs/setup/FIRESTORE_SETUP_GUIDE.md` - Firestoreの初期設定
  - `docs/setup/CREATE_FIRST_ADMIN.md` - 管理者アカウント作成
- 📖 **機能ガイド**: `docs/guides/` ディレクトリ
  - `docs/guides/ARCHITECTURE.md` - システム全体のアーキテクチャ
  - `docs/guides/DEPLOY_GUIDE.md` - デプロイ方法
- 🔧 **開発用**: `docs/dev/` ディレクトリ
  - `docs/dev/GETTING_STARTED.md` - 開発を始めるためのガイド
  - `docs/dev/IMPLEMENTATION_PLAN.md` - 実装計画
- 📑 **その他**: `docs/` ディレクトリ
  - `docs/MVP_CHECKLIST.md` - MVP機能チェックリスト
  - `docs/TEST_CHECKLIST.md` ⭐ - 詳細テストチェックリスト
  - `docs/TEST_SUMMARY.md` ⭐⭐ - テスト項目まとめ（クイック参照）
  - `docs/FILE_ORGANIZATION.md` - ファイル整理ガイド
  - `docs/FILE_ORGANIZATION_SUMMARY.md` - ファイル整理完了レポート

詳細は `docs/README.md` を参照してください。

## クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成:

```bash
cp .env.example .env.local
```

`.env.local` を編集して実際のFirebase設定を入力:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

---

## 🏗️ システムアーキテクチャ

### データベース構造

```
users/              # ユーザー情報（生徒・講師共通）
├── uid
├── email
├── displayName
├── role (student/instructor)
└── timestamps

instructors/        # 講師詳細情報
├── userId
├── bio
├── specialties
├── profileImageUrl
├── slackWebhookUrl
└── timestamps

availableSlots/    # 空き時間枠
├── instructorId
├── startTime
├── endTime
├── isBooked
└── timestamps

bookings/          # 予約情報
├── instructorId
├── studentId
├── slotId
├── startTime
├── endTime
├── purpose
├── status (confirmed/cancelled/completed)
└── timestamps
```

詳細は [docs/guides/ARCHITECTURE.md](docs/guides/ARCHITECTURE.md) を参照してください。

---

## 📱 主要画面

### 生徒用画面
- **講師一覧**: 全講師のプロフィール閲覧
- **講師詳細・予約**: カレンダーから空き時間を選んで予約
- **マイ予約**: 予約一覧・キャンセル

### 講師用画面
- **ダッシュボード**: 今日の予約・統計情報
- **空き時間管理**: カレンダーで空き時間を登録
- **予約一覧**: 全予約の確認
- **プロフィール編集**: 自己紹介・専門分野の編集

---

## 🔔 通知機能

### Slack通知
- 新規予約時: 講師にリアルタイム通知
- キャンセル時: 講師に通知

### メール通知
- 予約完了: 生徒と講師の両方に確認メール
- キャンセル: 生徒と講師の両方に通知メール

---

## 🛠️ 開発ロードマップ

### Phase 1: MVP（4-5週間）
- [x] 要件定義・設計
- [x] プロジェクトセットアップ ✨
- [x] 認証機能 ✨
- [x] 講師一覧・詳細 ✨
- [x] 予約機能（基本）✨
- [x] 空き時間管理 ✨

### Phase 2: 必須機能（2-3週間）
- [ ] キャンセル機能
- [ ] Slack通知
- [ ] メール通知
- [ ] 講師管理画面

### Phase 3: 改善（2-3週間）
- [ ] UI/UX改善
- [ ] テスト追加
- [ ] パフォーマンス最適化
- [ ] 本番デプロイ

### Phase 4: 将来的な拡張
- [ ] LINE公式アカウント対応
- [ ] グループMTG機能
- [ ] レビュー・評価機能
- [ ] 決済機能（有料化の場合）

---

## 💰 コスト見積もり

### 開発環境（無料）
- Firebase Emulator使用のため0円

### 本番環境（小規模）
- **Firebase Spark Plan（無料枠）**:
  - 講師10名、生徒100名程度なら無料枠内で運用可能
  
- **Firebase Blaze Plan（従量課金）**:
  - 月間予約数500-1000件で月額数百円〜1,000円程度
  - SendGrid: 月100通まで無料

---

## 🧪 テスト

### テストチェックリスト
MVP機能のテストはテストドキュメントを参照してください。

```bash
# テスト項目まとめを表示（クイック参照用）
open docs/TEST_SUMMARY.md

# 詳細テストチェックリストを表示
open docs/TEST_CHECKLIST.md
```

### ユニットテスト
```bash
npm run test
```

### E2Eテスト（将来追加予定）
```bash
npm run test:e2e
```

---

## 📢 通知機能（無料版 - GAS使用）

**完全無料**で動作するSlack通知システムを実装しました。Google Apps Script（GAS）を使用してSlack通知を送信します。

### 実装済みの通知

1. **予約確定時** ✅ - 生徒が予約した時に講師にSlack DMで通知
2. **予約キャンセル時** ✅ - 予約がキャンセルされた時に講師にSlack DMで通知

### 仕組み

```
予約イベント → Firestoreに通知データを作成 → GAS経由でSlack DM送信
```

Cloud Functions（Blazeプラン）は不要です。**Google Apps Script（無料）で動作します。**

### 設定手順

**詳細ガイド**: `docs/setup/GAS_SETUP_GUIDE.md` を参照してください。

1. Slack Appを作成し、Bot Tokenを取得
2. Google Apps Script（GAS）にコードを貼り付けてデプロイ
3. Firestoreの`instructors`コレクションに`slackMemberId`を設定

### 詳細

- **`docs/setup/GAS_SETUP_GUIDE.md`** ⭐ - GASの完全セットアップガイド（まずこれから！）
- `scripts/GAS_SLACK_CODE.js` - GASに貼り付けるコードファイル
- `docs/setup/SLACK_SETUP_STEP_BY_STEP.md` - Slack Appの作成手順
- `docs/setup/SLACK_WEBHOOK_GUIDE.md` - GASを使用したSlack通知の実装ガイド
- `docs/guides/NOTIFICATION_SYSTEM_GUIDE.md` - Firestore通知システムの詳細

---

## 🚢 デプロイ

### 本番環境

現在、Firebase Hostingにデプロイされています。

**URL**: https://glasses1-582eb.web.app

### 再デプロイ方法

```bash
# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

---

## 📞 サポート・問い合わせ

### 開発中の質問
1. まずドキュメントを確認
2. Firebase Emulator UIでデータ確認
3. ブラウザのコンソールでエラー確認

### トラブルシューティング
[docs/setup/LOCAL_SETUP_GUIDE.md](docs/setup/LOCAL_SETUP_GUIDE.md) のトラブルシューティングセクションを参照

---

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。

---

## 🎉 始めましょう！

準備ができたら、[docs/dev/GETTING_STARTED.md](docs/dev/GETTING_STARTED.md) を開いて開発を始めてください！

```bash
# まずはこれから！
open docs/dev/GETTING_STARTED.md
```