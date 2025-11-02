# ローカル開発環境セットアップガイド

## 🎯 このガイドの目的

このガイドでは、Firebase Emulatorを使用して**完全にローカル環境**で予約システムを開発する手順を説明します。本番Firebaseは後で設定するため、まずは開発環境の構築に集中できます。

---

## 📋 前提条件

### 必要なソフトウェア
- [ ] **Node.js**: v18.x 以上（推奨: v20.x）
- [ ] **npm** または **pnpm**: パッケージマネージャー
- [ ] **Git**: バージョン管理
- [ ] **VSCode**: エディタ（推奨）
- [ ] **Java**: Firebase Emulator実行に必要（JDK 11以上）

### インストール確認コマンド
```bash
node --version    # v18.0.0 以上
npm --version     # 9.0.0 以上
git --version     # 2.0.0 以上
java --version    # 11.0.0 以上
```

---

## 🚀 Step 1: プロジェクト初期化

### 1.1 Next.jsプロジェクト作成

```bash
cd /Users/sora/develop/glasses_1

# Next.jsプロジェクトを作成
npx create-next-app@latest . --typescript --tailwind --app --no-src

# プロジェクト構成:
# ✔ TypeScript? Yes
# ✔ ESLint? Yes
# ✔ Tailwind CSS? Yes
# ✔ App Router? Yes
# ✔ Customize import alias? No
```

### 1.2 必要なパッケージのインストール

```bash
# Firebase関連
npm install firebase firebase-admin firebase-functions

# UI・フォーム関連
npm install react-hook-form zod @hookform/resolvers
npm install react-big-calendar date-fns
npm install lucide-react class-variance-authority clsx tailwind-merge

# 開発ツール
npm install -D @types/react-big-calendar
npm install -D firebase-tools

# テスト関連（後で使用）
npm install -D jest @testing-library/react @testing-library/jest-dom
```

---

## 🔥 Step 2: Firebase Emulator セットアップ

### 2.1 Firebase CLIのグローバルインストール

```bash
npm install -g firebase-tools

# バージョン確認
firebase --version  # 13.0.0 以上
```

### 2.2 Firebaseプロジェクト初期化

```bash
# Firebaseログイン（スキップ可能 - ローカルのみの場合）
firebase login

# プロジェクト初期化
firebase init

# 選択項目:
# ? Which Firebase features do you want to set up?
#   ✔ Emulators
#   ✔ Firestore
#   ✔ Functions
#   ✔ Hosting

# ? What do you want to use as your public directory? out
# ? Configure as a single-page app? Yes
# ? Set up automatic builds and deploys with GitHub? No

# ? Which Firebase emulators do you want to set up?
#   ✔ Authentication Emulator
#   ✔ Functions Emulator
#   ✔ Firestore Emulator
#   ✔ Hosting Emulator
#   ✔ Storage Emulator

# ポート設定（デフォルトでOK）:
# Authentication: 9099
# Functions: 5001
# Firestore: 8080
# Hosting: 5000
# Storage: 9199
# UI: 4000
```

### 2.3 firebase.json の設定

プロジェクトルートに `firebase.json` が作成されます。以下のように設定を確認・調整：

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

### 2.4 Firestoreセキュリティルール（開発用）

`firestore.rules` を作成:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 開発中は全て許可（後で厳格化）
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**注意**: 本番環境では必ず厳格なルールに変更してください。

---

## 📁 Step 3: プロジェクト構造のセットアップ

### 3.1 ディレクトリ構成

```bash
mkdir -p app/{auth,student,instructor}
mkdir -p components/{ui,auth,booking,calendar,instructor}
mkdir -p lib/{firebase,api}
mkdir -p hooks
mkdir -p types
mkdir -p functions/src
```

### 3.2 環境変数の設定

`.env.local` を作成（ローカル開発用）:

```env
# Firebase Emulator用の設定
NEXT_PUBLIC_FIREBASE_API_KEY="demo-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="demo-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="demo-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="demo-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Emulatorを使用するフラグ
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

# Slack Webhook（開発用テストチャンネル）
SLACK_WEBHOOK_URL_TEST="https://hooks.slack.com/services/YOUR/TEST/WEBHOOK"

# SendGrid（開発用）
SENDGRID_API_KEY="your_test_api_key"
SENDGRID_FROM_EMAIL="test@example.com"
```

`.env.example` も作成（Git管理用）:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
SLACK_WEBHOOK_URL_TEST=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
```

### 3.3 .gitignore の更新

`.gitignore` に以下を追加:

```
# 環境変数
.env.local
.env.production

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Emulator data
emulator-data/
```

---

## 🔧 Step 4: Firebase初期化コード

### 4.1 Firebase設定ファイル

`lib/firebase/config.ts` を作成:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebaseアプリの初期化（複数回初期化を防ぐ）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// サービスの初期化
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Emulatorに接続（開発環境のみ）
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  console.log('🔥 Firebase Emulatorに接続しています...');
  
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  
  console.log('✅ Firebase Emulatorに接続しました');
}

export default app;
```

---

## 🎬 Step 5: 開発サーバーの起動

### 5.1 Firebase Emulatorの起動

**ターミナル1**（Firebase Emulator）:

```bash
# Emulatorを起動
firebase emulators:start

# または、データを保存する場合:
firebase emulators:start --import=./emulator-data --export-on-exit
```

起動後、以下のURLにアクセス可能:
- **Emulator UI**: http://localhost:4000
- **Authentication**: http://localhost:9099
- **Firestore**: http://localhost:8080
- **Functions**: http://localhost:5001
- **Storage**: http://localhost:9199

### 5.2 Next.js開発サーバーの起動

**ターミナル2**（Next.js）:

```bash
npm run dev
```

起動後:
- **アプリ**: http://localhost:3000

---

## 🧪 Step 6: 動作確認

### 6.1 Firebaseの動作確認

最小限のテストページを作成して動作確認:

`app/test/page.tsx` を作成:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function TestPage() {
  const [status, setStatus] = useState('待機中...');
  const [data, setData] = useState<any[]>([]);

  const testFirestore = async () => {
    try {
      // テストデータを追加
      setStatus('データを追加中...');
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello from Firebase Emulator!',
        timestamp: new Date(),
      });
      setStatus(`データ追加成功: ${docRef.id}`);

      // データを取得
      const querySnapshot = await getDocs(collection(db, 'test'));
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(docs);
    } catch (error) {
      setStatus(`エラー: ${error}`);
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase接続テスト</h1>
      <button
        onClick={testFirestore}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Firestoreテスト
      </button>
      <p className="mt-4">ステータス: {status}</p>
      <div className="mt-4">
        <h2 className="font-bold">取得データ:</h2>
        <pre className="bg-gray-100 p-4 rounded mt-2">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

### 6.2 動作確認手順

1. http://localhost:3000/test にアクセス
2. 「Firestoreテスト」ボタンをクリック
3. データが追加され、取得できることを確認
4. http://localhost:4000 （Emulator UI）でデータを確認

---

## 📦 Step 7: シードデータの投入

開発用のテストデータを投入します。

### 7.1 シードスクリプト作成

`scripts/seed-data.ts` を作成:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { connectAuthEmulator, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase初期化（Emulator接続）
const app = initializeApp({
  apiKey: 'demo-api-key',
  projectId: 'demo-project',
});

const auth = getAuth(app);
const db = getFirestore(app);

// Emulatorに接続
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
connectFirestoreEmulator(db, 'localhost', 8080);

// シードデータ
const seedData = async () => {
  console.log('🌱 シードデータを投入しています...');

  try {
    // 1. 講師ユーザーを作成
    const instructors = [
      { email: 'instructor1@example.com', name: '山田太郎', specialties: ['プログラミング', 'Web開発'] },
      { email: 'instructor2@example.com', name: '佐藤花子', specialties: ['デザイン', 'UI/UX'] },
      { email: 'instructor3@example.com', name: '鈴木一郎', specialties: ['データサイエンス', 'AI'] },
    ];

    for (const instructor of instructors) {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        instructor.email,
        'password123'
      );
      const uid = userCredential.user.uid;

      // usersコレクションに保存
      await setDoc(doc(db, 'users', uid), {
        email: instructor.email,
        displayName: instructor.name,
        role: 'instructor',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // instructorsコレクションに保存
      await setDoc(doc(db, 'instructors', uid), {
        userId: uid,
        bio: `${instructor.name}です。よろしくお願いします。`,
        specialties: instructor.specialties,
        profileImageUrl: '',
        slackWebhookUrl: process.env.SLACK_WEBHOOK_URL_TEST || '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 空き時間を作成（今日から2週間分）
      const today = new Date();
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        // 10:00-11:00, 14:00-15:00, 16:00-17:00 の3枠
        for (const hour of [10, 14, 16]) {
          const startTime = new Date(date);
          startTime.setHours(hour, 0, 0, 0);
          const endTime = new Date(startTime);
          endTime.setHours(hour + 1, 0, 0, 0);

          await addDoc(collection(db, 'availableSlots'), {
            instructorId: uid,
            startTime,
            endTime,
            isBooked: false,
            createdAt: new Date(),
          });
        }
      }

      console.log(`✅ 講師「${instructor.name}」のデータを投入しました`);
    }

    // 2. 生徒ユーザーを作成
    const students = [
      { email: 'student1@example.com', name: '田中太郎' },
      { email: 'student2@example.com', name: '山本花子' },
    ];

    for (const student of students) {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        student.email,
        'password123'
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        email: student.email,
        displayName: student.name,
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ 生徒「${student.name}」のデータを投入しました`);
    }

    console.log('🎉 シードデータの投入が完了しました！');
    console.log('\nログイン情報:');
    console.log('講師: instructor1@example.com / password123');
    console.log('生徒: student1@example.com / password123');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }

  process.exit(0);
};

seedData();
```

### 7.2 package.jsonにスクリプト追加

`package.json` の `scripts` に追加:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "emulator": "firebase emulators:start --import=./emulator-data --export-on-exit",
    "seed": "ts-node -r tsconfig-paths/register scripts/seed-data.ts"
  }
}
```

必要なパッケージをインストール:

```bash
npm install -D ts-node tsconfig-paths
```

### 7.3 シードデータの実行

```bash
# Emulatorが起動していることを確認してから実行
npm run seed
```

---

## 🛠️ Step 8: 開発ワークフロー

### 日常的な開発フロー

**1. 朝の起動**
```bash
# ターミナル1: Emulatorを起動
npm run emulator

# ターミナル2: 開発サーバーを起動
npm run dev
```

**2. 開発中**
- コードを編集
- http://localhost:3000 で動作確認
- http://localhost:4000 でデータ確認

**3. 終了時**
- Ctrl+C でサーバーを停止
- Emulatorのデータは自動的に保存される（`--export-on-exit`オプション使用時）

---

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. Emulatorが起動しない
```bash
# Javaがインストールされているか確認
java --version

# ポートが使用中の場合
lsof -ti:8080 | xargs kill -9  # Firestoreポート
lsof -ti:9099 | xargs kill -9  # Authポート
```

#### 2. データが保存されない
```bash
# export-on-exitオプションを使用
firebase emulators:start --import=./emulator-data --export-on-exit
```

#### 3. Firebaseに接続できない
- `.env.local` の `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` を確認
- Emulatorが起動しているか確認
- ブラウザのコンソールでエラーを確認

#### 4. TypeScriptエラー
```bash
# 型定義を再インストール
npm install -D @types/node @types/react @types/react-dom
```

---

## 📊 開発環境の確認チェックリスト

- [ ] Node.js, npm がインストールされている
- [ ] Java がインストールされている
- [ ] Firebase CLI がインストールされている
- [ ] プロジェクトが初期化されている
- [ ] `.env.local` が作成されている
- [ ] Firebase Emulator が起動する
- [ ] Next.js 開発サーバーが起動する
- [ ] http://localhost:4000 でEmulator UIが開く
- [ ] http://localhost:3000 でアプリが開く
- [ ] テストページでFirestoreに接続できる
- [ ] シードデータが投入できる

---

## 🎓 次のステップ

ローカル環境のセットアップが完了したら、次は実装に進みましょう：

1. **認証機能の実装** → ログイン・新規登録画面
2. **講師一覧の実装** → データ表示
3. **予約機能の実装** → カレンダー・予約フォーム
4. **通知機能の実装** → Slack・メール

詳細は `IMPLEMENTATION_PLAN.md` を参照してください！

