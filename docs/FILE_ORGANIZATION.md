# ファイル整理ガイド

このプロジェクトのファイル整理方法とディレクトリ構造の説明です。

---

## 📂 ディレクトリ構造

```
glasses_1/
├── app/                     # Next.jsアプリケーション
│   ├── admin/              # 管理者画面
│   ├── auth/               # 認証画面
│   ├── instructor/         # 講師画面
│   ├── student/            # 生徒画面
│   ├── report/             # 通報ページ
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # ホームページ
│   └── globals.css         # グローバルスタイル
├── components/             # Reactコンポーネント
│   ├── availability/       # 空き時間管理コンポーネント
│   └── ui/                 # UIコンポーネント
├── docs/                   # ドキュメント
│   ├── README.md           # ドキュメント一覧
│   ├── MVP_CHECKLIST.md    # MVP実装チェックリスト
│   ├── TEST_CHECKLIST.md   # テストチェックリスト
│   ├── setup/              # セットアップガイド
│   ├── guides/             # 機能ガイド
│   ├── dev/                # 開発用ドキュメント
│   └── FILE_ORGANIZATION.md # このファイル
├── hooks/                  # カスタムフック
├── lib/                    # ライブラリ
│   ├── firebase/           # Firebase関連
│   └── templates/          # テンプレート
├── scripts/                # スクリプト
│   ├── GAS_SLACK_CODE.js   # GAS用コード
│   └── check-users.js      # ユーザー確認スクリプト
├── types/                  # TypeScript型定義
├── public/                 # 静的ファイル
├── functions/              # Cloud Functions（未使用）
├── logs/                   # ログファイル格納
├── out/                    # ビルド出力（自動生成）
├── firebase.json           # Firebase設定
├── firestore.rules         # Firestore セキュリティルール
├── firestore.indexes.json  # Firestore インデックス
├── package.json            # npm設定
├── next.config.js          # Next.js設定
├── tailwind.config.ts      # Tailwind CSS設定
├── tsconfig.json           # TypeScript設定
└── README.md               # プロジェクト概要
```

---

## 📋 ドキュメントの分類

### `docs/setup/` - セットアップガイド
環境構築や初期設定に必要なガイドです。

**推奨順序**:
1. **FIREBASE_SETUP.md** - Firebaseプロジェクトの作成
2. **LOCAL_SETUP_GUIDE.md** - ローカル開発環境の構築
3. **CREATE_FIRST_ADMIN.md** - 最初の管理者アカウント
4. **FIRESTORE_SETUP_GUIDE.md** - Firestoreの設定
5. **AUTH_AND_STUDENT_PROFILE.md** - 認証システムの理解
6. **GAS_SETUP_GUIDE.md** - Slack通知の設定（必要に応じて）

### `docs/guides/` - 機能ガイド
システムの各機能の詳細な説明です。

- **ARCHITECTURE.md** - システム全体のアーキテクチャ
- **DEPLOY_GUIDE.md** - デプロイ方法
- **NOTIFICATION_SYSTEM_GUIDE.md** - 通知システムの仕組み

### `docs/dev/` - 開発用ドキュメント
開発中の参考資料です。

- **GETTING_STARTED.md** - 開発を始めるためのガイド
- **IMPLEMENTATION_PLAN.md** - 実装計画
- **REQUIREMENTS.md** - 要件定義
- **PROJECT_SUMMARY.md** - プロジェクト概要
- **STATUS.md** - 現在の状態
- **LOCAL_MOCK_GUIDE.md** - ローカルモックの使い方

### ルートレベルのドキュメント
- **MVP_CHECKLIST.md** - MVP機能の実装状況
- **TEST_CHECKLIST.md** - テスト項目

---

## 📝 ファイル命名規則

### ドキュメントファイル
- **大文字**で始まり、アンダースコアで区切る
- 拡張子: `.md`
- 例: `SETUP_GUIDE.md`, `ARCHITECTURE.md`

### コンポーネントファイル
- **大文字**で始まり、PascalCase
- 拡張子: `.tsx`
- 例: `BookingConfirm.tsx`, `MobileHeader.tsx`

### ユーティリティファイル
- **小文字**で始まり、camelCase
- 拡張子: `.ts`
- 例: `bookings.ts`, `useAuth.ts`

---

## 🗑️ 削除可能なファイル

### ビルド生成物
- `out/` - Next.jsのビルド出力（`.gitignore`に含める）

### 開発中の一時ファイル
- `temp_*.md` - 一時的なメモ
- `firestore-debug.log` - デバッグログ

### 未使用のディレクトリ
- 空のコンポーネントディレクトリ
- 使用していないテンプレートディレクトリ

---

## 🔄 ファイル移動の推奨

### 自動生成されるファイル
以下のファイルは自動生成されるため、手動で編集しないでください。
- `next-env.d.ts` - Next.jsの型定義（自動生成）
- `package-lock.json` - npmの依存関係（自動生成）
- `out/` - ビルド出力（自動生成）

### 設定ファイル
ルートディレクトリに配置すべき設定ファイル。
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `next.config.js`
- `tailwind.config.ts`
- `tsconfig.json`
- `package.json`

---

## 📚 ドキュメントの更新方法

### 新機能追加時
1. `docs/dev/IMPLEMENTATION_PLAN.md` を更新
2. 必要に応じて `docs/guides/` にガイドを追加
3. `MVP_CHECKLIST.md` を更新

### バグ修正時
1. 関連するドキュメントを確認
2. 必要に応じて修正手順を追記

### デプロイ時
1. `docs/guides/DEPLOY_GUIDE.md` を参照
2. 更新履歴を記録

---

## 🎯 推奨されるファイル構造

### 最小構成
```
glasses_1/
├── app/
├── components/
├── docs/
│   ├── setup/
│   ├── guides/
│   └── dev/
├── hooks/
├── lib/
├── scripts/
├── types/
├── public/
├── firebase.json
├── firestore.rules
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

---

## 📌 重要な注意事項

### Git管理
- `.gitignore` に `out/`, `node_modules/`, `logs/` を含める
- デバッグログはGitにコミットしない

### ビルド出力
- `out/` は自動生成されるため、手動で編集しない
- デプロイ時に自動的に作成される

### 環境変数
- `.env.local` は `.gitignore` に含める
- `.env.example` をテンプレートとして提供

---

## 🔗 関連リンク

- **プロジェクト概要**: `../README.md`
- **ドキュメント一覧**: `README.md`
- **MVPチェックリスト**: `MVP_CHECKLIST.md`
- **テストチェックリスト**: `TEST_CHECKLIST.md`

