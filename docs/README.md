# ドキュメント一覧

このディレクトリには、プロジェクトのドキュメントが分類して保存されています。

---

## 📂 ディレクトリ構造

```
docs/
├── README.md (このファイル)
├── FILE_ORGANIZATION.md            # ファイル整理ガイド
├── FILE_ORGANIZATION_SUMMARY.md    # ファイル整理完了レポート
├── MVP_CHECKLIST.md                # MVP機能実装チェックリスト
├── TEST_CHECKLIST.md               # テストチェックリスト
├── setup/                          # セットアップガイド（10ファイル）
├── guides/                         # 機能ガイド（3ファイル）
└── dev/                            # 開発用ドキュメント（7ファイル）
```

---

## 📋 セットアップガイド (`setup/`)

プロジェクトのセットアップや初期設定に関するガイドです。

### 必須のセットアップ
- **ADMIN_ACCOUNT_GUIDE.md** - 管理者アカウントの作成方法
- **CREATE_FIRST_ADMIN.md** - 最初の管理者アカウント作成手順
- **FIRESTORE_SETUP_GUIDE.md** - Firestoreの初期設定

### Firebase設定
- **FIREBASE_SETUP.md** - Firebaseプロジェクトのセットアップ
- **LOCAL_SETUP_GUIDE.md** - ローカル開発環境のセットアップ

### 認証設定
- **AUTH_AND_STUDENT_PROFILE.md** - 認証システムと生徒プロフィール
- **AUTH_GUIDE.md** - 認証機能の詳細

### Slack通知設定
- **GAS_SETUP_GUIDE.md** ⭐ - GASの完全セットアップガイド（まずこれから！）
- **SLACK_SETUP_STEP_BY_STEP.md** - Slack Appの作成手順
- **SLACK_WEBHOOK_GUIDE.md** - GASを使用したSlack通知の実装ガイド

---

## 📖 機能ガイド (`guides/`)

システムの機能やアーキテクチャに関する詳細なガイドです。

- **ARCHITECTURE.md** - システム全体のアーキテクチャ
- **DEPLOY_GUIDE.md** - デプロイ方法の詳細
- **NOTIFICATION_SYSTEM_GUIDE.md** - 通知システムの詳細

---

## 🔧 開発用ドキュメント (`dev/`)

開発中の参考資料や仕様書です。

### 開発ガイド
- **GETTING_STARTED.md** - 開発を始めるためのガイド

### 仕様・設計
- **IMPLEMENTATION_PLAN.md** - 実装計画
- **PROJECT_SUMMARY.md** - プロジェクト概要
- **REQUIREMENTS.md** - 要件定義

### 開発情報
- **STATUS.md** - プロジェクトの現在の状態
- **FIX_COLLECTION_NAME.md** - コレクション名の修正履歴
- **LOCAL_MOCK_GUIDE.md** - ローカルモックの使い方

---

## 📋 チェックリスト

docs/ ディレクトリに配置されています。

- **MVP_CHECKLIST.md** - MVP機能の実装チェックリスト
- **TEST_CHECKLIST.md** ⭐ - テスト実行用の詳細チェックリスト
- **TEST_SUMMARY.md** ⭐⭐ - テスト項目まとめ（クイック参照用）

## 📁 ファイル整理

- **FILE_ORGANIZATION.md** - ファイル整理の方法とディレクトリ構造の説明
- **FILE_ORGANIZATION_SUMMARY.md** - ファイル整理完了レポート

---

## 🚀 スクリプト

ルートディレクトリの `scripts/` に配置されています。

- **GAS_SLACK_CODE.js** - GASに貼り付けるSlack通知コード
- **check-users.js** - ユーザーデータ確認用スクリプト

---

## 📍 使い方

### 新しく開発を始める場合

1. **GETTING_STARTED.md** を読む
2. **LOCAL_SETUP_GUIDE.md** に従って環境を構築
3. **FIRESTORE_SETUP_GUIDE.md** でFirestoreをセットアップ

### Slack通知を設定する場合

1. **GAS_SETUP_GUIDE.md** ⭐ を読む（完全ガイド）
2. 必要な場合は **SLACK_SETUP_STEP_BY_STEP.md** も参照
3. `scripts/GAS_SLACK_CODE.js` のコードを使用

### デプロイする場合

1. **DEPLOY_GUIDE.md** を読む
2. Firebase Consoleで確認
3. デプロイ実行

---

## 🔗 関連リンク

- **本番URL**: https://glasses1-582eb.web.app
- **Firebase Console**: https://console.firebase.google.com/project/glasses1-582eb/overview
- **プロジェクトルート**: `../README.md`

