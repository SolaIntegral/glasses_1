# 実装計画書 - TypeScript + Firebase 予約システム

## 📱 技術スタック詳細

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui または Chakra UI
- **カレンダー**: react-big-calendar または FullCalendar
- **状態管理**: React Context API または Zustand
- **フォーム**: React Hook Form + Zod（バリデーション）

### バックエンド
- **BaaS**: Firebase
  - **Authentication**: メール/パスワード認証（将来的にGoogle認証も追加可能）
  - **Firestore**: NoSQLデータベース
  - **Cloud Functions**: Slack通知、メール送信などのサーバー処理
  - **Hosting**: 静的サイトホスティング
  - **Storage**: プロフィール画像などのファイル保存

### 通知・連携
- **Slack**: Incoming Webhooks または Slack API
- **メール**: Firebase Extensions (Trigger Email) または SendGrid

### 開発環境
- **パッケージ管理**: npm または pnpm
- **コード品質**: ESLint, Prettier
- **型チェック**: TypeScript strict mode

---

## 🗄️ Firestoreデータベース設計

### コレクション構造

```
/users/{userId}
  - email: string
  - displayName: string
  - role: 'instructor' | 'student'
  - createdAt: timestamp
  - updatedAt: timestamp

/instructors/{instructorId}
  - userId: string (users コレクションへの参照)
  - profileImageUrl: string
  - bio: string
  - specialties: string[]
  - slackWebhookUrl: string (暗号化推奨)
  - isActive: boolean
  - createdAt: timestamp
  - updatedAt: timestamp

/availableSlots/{slotId}
  - instructorId: string
  - startTime: timestamp
  - endTime: timestamp
  - isBooked: boolean
  - createdAt: timestamp

/bookings/{bookingId}
  - instructorId: string
  - studentId: string
  - slotId: string
  - startTime: timestamp
  - endTime: timestamp
  - purpose: string
  - notes: string
  - status: 'confirmed' | 'cancelled' | 'completed'
  - createdAt: timestamp
  - updatedAt: timestamp
  - cancelledAt: timestamp (optional)
  - cancelReason: string (optional)
```

### セキュリティルール（例）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ユーザーは自分のデータのみ読み書き可能
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // 講師情報は全員読み取り可能、講師本人のみ編集可能
    match /instructors/{instructorId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/instructors/$(instructorId)).data.userId == request.auth.uid;
    }
    
    // 空き時間は全員読み取り可能、講師のみ作成・編集可能
    match /availableSlots/{slotId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null &&
                               exists(/databases/$(database)/documents/instructors/$(request.resource.data.instructorId)) &&
                               get(/databases/$(database)/documents/instructors/$(request.resource.data.instructorId)).data.userId == request.auth.uid;
      allow delete: if request.auth != null &&
                       get(/databases/$(database)/documents/instructors/$(resource.data.instructorId)).data.userId == request.auth.uid;
    }
    
    // 予約は全員作成可能、関係者のみ読み取り・更新可能
    match /bookings/{bookingId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
                     (resource.data.studentId == request.auth.uid ||
                      get(/databases/$(database)/documents/instructors/$(resource.data.instructorId)).data.userId == request.auth.uid);
      allow update: if request.auth != null && 
                       (resource.data.studentId == request.auth.uid ||
                        get(/databases/$(database)/documents/instructors/$(resource.data.instructorId)).data.userId == request.auth.uid);
    }
  }
}
```

---

## 🎨 画面設計

### 1. 認証画面
- **ログイン画面** (`/login`)
  - メール・パスワード入力
  - 「新規登録はこちら」リンク
  - パスワードリセットリンク

- **新規登録画面** (`/register`)
  - 名前、メール、パスワード入力
  - ロール選択（生徒 or 講師）
  - 利用規約同意チェックボックス

### 2. 生徒向け画面
- **講師一覧画面** (`/instructors`)
  - 講師カード一覧（写真、名前、専門分野）
  - フィルター機能（専門分野で絞り込み）
  - 各講師カードクリックで詳細画面へ

- **講師詳細・予約画面** (`/instructors/[instructorId]`)
  - 講師プロフィール詳細
  - カレンダー表示（2週間分の空き時間）
  - 時間枠クリックで予約モーダル表示
  - 予約確認・確定

- **マイ予約一覧** (`/my-bookings`)
  - 予約済みMTG一覧（日時、講師名、ステータス）
  - キャンセルボタン
  - フィルター（今後の予約、過去の予約）

### 3. 講師向け画面
- **ダッシュボード** (`/instructor/dashboard`)
  - 今日の予約一覧
  - 今週の予約数
  - 空き時間設定へのリンク

- **空き時間管理** (`/instructor/availability`)
  - カレンダービュー
  - 空き時間の追加・削除
  - 一括設定機能（毎週月・水・金の10:00-18:00など）

- **予約一覧** (`/instructor/bookings`)
  - 全予約の一覧
  - フィルター（日付、ステータス）
  - 各予約の詳細確認

- **プロフィール編集** (`/instructor/profile`)
  - 写真アップロード
  - 自己紹介編集
  - 専門分野タグ追加
  - Slack Webhook URL設定

### 4. 共通画面
- **ホーム画面** (`/`)
  - サービス説明
  - ログイン/新規登録ボタン
  - ログイン済みの場合は適切な画面にリダイレクト

- **マイページ** (`/profile`)
  - ユーザー情報表示・編集
  - パスワード変更
  - ログアウト

---

## 🔧 主要機能の実装詳細

### 1. ユーザー認証フロー

```typescript
// lib/auth.ts
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string, 
  role: 'student' | 'instructor'
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Firestoreにユーザー情報を保存
  await setDoc(doc(db, 'users', user.uid), {
    email,
    displayName,
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // 講師の場合は講師情報も作成
  if (role === 'instructor') {
    await setDoc(doc(db, 'instructors', user.uid), {
      userId: user.uid,
      bio: '',
      specialties: [],
      profileImageUrl: '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  return user;
};
```

### 2. 空き時間の設定・取得

```typescript
// lib/availability.ts
export const createAvailableSlot = async (
  instructorId: string,
  startTime: Date,
  endTime: Date
) => {
  const slotRef = await addDoc(collection(db, 'availableSlots'), {
    instructorId,
    startTime,
    endTime,
    isBooked: false,
    createdAt: new Date()
  });
  return slotRef.id;
};

export const getAvailableSlots = async (
  instructorId: string,
  startDate: Date,
  endDate: Date
) => {
  const q = query(
    collection(db, 'availableSlots'),
    where('instructorId', '==', instructorId),
    where('startTime', '>=', startDate),
    where('startTime', '<=', endDate),
    where('isBooked', '==', false),
    orderBy('startTime', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

### 3. 予約処理（トランザクション + 24時間チェック）

```typescript
// lib/bookings.ts
import { runTransaction, doc, collection } from 'firebase/firestore';
import { db } from './firebase/config';

export const createBooking = async (
  instructorId: string,
  studentId: string,
  slotId: string,
  startTime: Date,
  endTime: Date,
  purpose: string
) => {
  // 24時間以上先かチェック
  const now = new Date();
  const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 24) {
    throw new Error('予約は24時間以上前に行う必要があります');
  }
  
  const bookingRef = doc(collection(db, 'bookings'));
  const slotRef = doc(db, 'availableSlots', slotId);
  
  // トランザクションで予約と空き時間の更新を同時実行
  await runTransaction(db, async (transaction) => {
    const slotDoc = await transaction.get(slotRef);
    
    if (!slotDoc.exists()) {
      throw new Error('空き時間が見つかりません');
    }
    
    if (slotDoc.data().isBooked) {
      throw new Error('この時間は既に予約されています');
    }
    
    // 予約を作成
    transaction.set(bookingRef, {
      instructorId,
      studentId,
      slotId,
      startTime,
      endTime,
      purpose,
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 空き時間を予約済みに更新
    transaction.update(slotRef, {
      isBooked: true
    });
  });
  
  // Cloud Functionをトリガーして通知を送信
  // （実際の通知はCloud Functionで処理）
  
  return bookingRef.id;
};

// キャンセル処理
export const cancelBooking = async (
  bookingId: string,
  slotId: string,
  startTime: Date,
  cancelReason?: string
) => {
  // 24時間以上前かチェック
  const now = new Date();
  const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 24) {
    throw new Error('キャンセルは24時間前までです');
  }
  
  const bookingRef = doc(db, 'bookings', bookingId);
  const slotRef = doc(db, 'availableSlots', slotId);
  
  // トランザクションでキャンセル処理
  await runTransaction(db, async (transaction) => {
    const bookingDoc = await transaction.get(bookingRef);
    
    if (!bookingDoc.exists()) {
      throw new Error('予約が見つかりません');
    }
    
    if (bookingDoc.data().status === 'cancelled') {
      throw new Error('既にキャンセルされています');
    }
    
    // 予約をキャンセル状態に更新
    transaction.update(bookingRef, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: cancelReason || '',
      updatedAt: new Date()
    });
    
    // 空き時間を再度利用可能に
    transaction.update(slotRef, {
      isBooked: false
    });
  });
  
  return bookingId;
};
```

### 4. Slack通知 + メール通知（Cloud Functions）

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();

// SendGrid設定
const SENDGRID_API_KEY = functions.config().sendgrid?.apikey || process.env.SENDGRID_API_KEY;
const FROM_EMAIL = functions.config().sendgrid?.fromemail || process.env.SENDGRID_FROM_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// 予約作成時の通知
export const onBookingCreated = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    const bookingId = context.params.bookingId;
    
    // 講師情報を取得
    const instructorDoc = await admin.firestore()
      .collection('instructors')
      .doc(booking.instructorId)
      .get();
    const instructor = instructorDoc.data();
    
    // 講師ユーザー情報を取得
    const instructorUserDoc = await admin.firestore()
      .collection('users')
      .doc(booking.instructorId)
      .get();
    const instructorUser = instructorUserDoc.data();
    
    // 生徒情報を取得
    const studentDoc = await admin.firestore()
      .collection('users')
      .doc(booking.studentId)
      .get();
    const student = studentDoc.data();
    
    const startTime = booking.startTime.toDate();
    const formattedTime = startTime.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Slack通知を送信
    if (instructor?.slackWebhookUrl) {
      const slackMessage = {
        text: '🔔 新しい予約が入りました',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🔔 新しい予約が入りました'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*日時:*\n${formattedTime}`
              },
              {
                type: 'mrkdwn',
                text: `*生徒名:*\n${student?.displayName}`
              },
              {
                type: 'mrkdwn',
                text: `*メール:*\n${student?.email}`
              },
              {
                type: 'mrkdwn',
                text: `*相談内容:*\n${booking.purpose}`
              }
            ]
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '予約詳細を見る'
                },
                url: `https://yourdomain.com/instructor/bookings/${bookingId}`
              }
            ]
          }
        ]
      };
      
      try {
        await axios.post(instructor.slackWebhookUrl, slackMessage);
        console.log('Slack通知を送信しました');
      } catch (error) {
        console.error('Slack通知の送信に失敗しました', error);
      }
    }
    
    // メール通知を送信
    if (SENDGRID_API_KEY && FROM_EMAIL) {
      try {
        // 講師へのメール
        await sgMail.send({
          to: instructorUser?.email,
          from: FROM_EMAIL,
          subject: '新しい予約が入りました',
          html: `
            <h2>新しい予約が入りました</h2>
            <p><strong>日時:</strong> ${formattedTime}</p>
            <p><strong>生徒名:</strong> ${student?.displayName}</p>
            <p><strong>メール:</strong> ${student?.email}</p>
            <p><strong>相談内容:</strong> ${booking.purpose}</p>
            <p><a href="https://yourdomain.com/instructor/bookings/${bookingId}">予約詳細を見る</a></p>
          `
        });
        
        // 生徒へのメール（予約確認）
        await sgMail.send({
          to: student?.email,
          from: FROM_EMAIL,
          subject: '予約が完了しました',
          html: `
            <h2>予約が完了しました</h2>
            <p>${student?.displayName} 様</p>
            <p>以下の内容で予約が完了しました。</p>
            <p><strong>講師:</strong> ${instructorUser?.displayName}</p>
            <p><strong>日時:</strong> ${formattedTime}</p>
            <p><strong>相談内容:</strong> ${booking.purpose}</p>
            <p>※キャンセルは24時間前までマイページから可能です。</p>
            <p><a href="https://yourdomain.com/my-bookings">マイページを見る</a></p>
          `
        });
        
        console.log('メール通知を送信しました');
      } catch (error) {
        console.error('メール送信に失敗しました', error);
      }
    }
  });

// 予約キャンセル時の通知
export const onBookingCancelled = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const bookingId = context.params.bookingId;
    
    // statusがcancelledに変更された場合のみ処理
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      // 講師情報を取得
      const instructorDoc = await admin.firestore()
        .collection('instructors')
        .doc(after.instructorId)
        .get();
      const instructor = instructorDoc.data();
      
      const instructorUserDoc = await admin.firestore()
        .collection('users')
        .doc(after.instructorId)
        .get();
      const instructorUser = instructorUserDoc.data();
      
      // 生徒情報を取得
      const studentDoc = await admin.firestore()
        .collection('users')
        .doc(after.studentId)
        .get();
      const student = studentDoc.data();
      
      const startTime = after.startTime.toDate();
      const formattedTime = startTime.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Slack通知
      if (instructor?.slackWebhookUrl) {
        const slackMessage = {
          text: '❌ 予約がキャンセルされました',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '❌ 予約がキャンセルされました'
              }
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*日時:*\n${formattedTime}`
                },
                {
                  type: 'mrkdwn',
                  text: `*生徒名:*\n${student?.displayName}`
                },
                {
                  type: 'mrkdwn',
                  text: `*キャンセル理由:*\n${after.cancelReason || 'なし'}`
                }
              ]
            }
          ]
        };
        
        try {
          await axios.post(instructor.slackWebhookUrl, slackMessage);
          console.log('キャンセル通知（Slack）を送信しました');
        } catch (error) {
          console.error('Slack通知の送信に失敗しました', error);
        }
      }
      
      // メール通知
      if (SENDGRID_API_KEY && FROM_EMAIL) {
        try {
          // 講師へのメール
          await sgMail.send({
            to: instructorUser?.email,
            from: FROM_EMAIL,
            subject: '予約がキャンセルされました',
            html: `
              <h2>予約がキャンセルされました</h2>
              <p><strong>日時:</strong> ${formattedTime}</p>
              <p><strong>生徒名:</strong> ${student?.displayName}</p>
              <p><strong>キャンセル理由:</strong> ${after.cancelReason || 'なし'}</p>
            `
          });
          
          // 生徒へのメール（キャンセル確認）
          await sgMail.send({
            to: student?.email,
            from: FROM_EMAIL,
            subject: '予約をキャンセルしました',
            html: `
              <h2>予約をキャンセルしました</h2>
              <p>${student?.displayName} 様</p>
              <p>以下の予約がキャンセルされました。</p>
              <p><strong>講師:</strong> ${instructorUser?.displayName}</p>
              <p><strong>日時:</strong> ${formattedTime}</p>
              <p>またのご利用をお待ちしております。</p>
            `
          });
          
          console.log('キャンセル通知（メール）を送信しました');
        } catch (error) {
          console.error('メール送信に失敗しました', error);
        }
      }
    }
  });
```

---

## 📁 プロジェクト構成

```
glasses_1/
├── .github/
│   └── workflows/          # CI/CD設定
├── public/                 # 静的ファイル
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (student)/
│   │   │   ├── instructors/
│   │   │   └── my-bookings/
│   │   ├── (instructor)/
│   │   │   ├── dashboard/
│   │   │   ├── availability/
│   │   │   ├── bookings/
│   │   │   └── profile/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/        # Reactコンポーネント
│   │   ├── ui/           # shadcn/ui コンポーネント
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── calendar/
│   │   └── instructor/
│   ├── lib/              # ユーティリティ・ヘルパー
│   │   ├── firebase.ts   # Firebase初期化
│   │   ├── auth.ts       # 認証関連
│   │   ├── bookings.ts   # 予約関連
│   │   ├── availability.ts
│   │   └── utils.ts
│   ├── hooks/            # カスタムフック
│   │   ├── useAuth.ts
│   │   ├── useBookings.ts
│   │   └── useInstructors.ts
│   ├── types/            # TypeScript型定義
│   │   └── index.ts
│   └── styles/           # グローバルスタイル
│       └── globals.css
├── functions/            # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase.json         # Firebase設定
├── firestore.rules       # Firestoreセキュリティルール
├── firestore.indexes.json
├── .env.local            # 環境変数（Gitにコミットしない）
├── .env.example          # 環境変数のサンプル
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 開発ステップ

### Phase 1: プロジェクトセットアップ（1-2日）
- [ ] Next.js + TypeScript プロジェクト作成
- [ ] Firebase プロジェクト作成・設定
- [ ] 必要なパッケージのインストール
- [ ] 環境変数の設定
- [ ] 基本的なレイアウト作成

### Phase 2: 認証機能（2-3日）
- [ ] Firebase Authentication 設定
- [ ] ログイン画面の実装
- [ ] 新規登録画面の実装
- [ ] 認証状態管理（Context/Hook）
- [ ] ルートガード実装

### Phase 3: 講師管理（3-4日）
- [ ] Firestore講師コレクション設計
- [ ] 講師一覧画面の実装
- [ ] 講師詳細画面の実装
- [ ] 講師プロフィール編集画面（講師用）
- [ ] プロフィール画像アップロード機能

### Phase 4: 空き時間管理（4-5日）
- [ ] Firestoreスロットコレクション設計
- [ ] カレンダーコンポーネント実装
- [ ] 空き時間登録機能（講師用）
- [ ] 空き時間一覧表示（生徒用）
- [ ] 一括登録機能（講師用）

### Phase 5: 予約機能（5-7日）
- [ ] 予約フォーム実装
- [ ] 予約処理（トランザクション）
- [ ] 予約一覧表示（生徒用）
- [ ] 予約一覧表示（講師用）
- [ ] 予約詳細画面

### Phase 6: キャンセル機能（2-3日）
- [ ] キャンセル処理実装
- [ ] キャンセルポリシー設定
- [ ] キャンセル確認モーダル
- [ ] キャンセル後の空き時間復元

### Phase 7: Slack通知（2-3日）
- [ ] Cloud Functions セットアップ
- [ ] Slack Webhook 設定
- [ ] 予約時の通知実装
- [ ] キャンセル時の通知実装
- [ ] Webhook URL管理画面（講師用）

### Phase 8: テスト・改善（3-5日）
- [ ] ユニットテスト作成
- [ ] 統合テスト
- [ ] ユーザビリティテスト
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング改善

### Phase 9: デプロイ（1-2日）
- [ ] Firebase Hosting デプロイ
- [ ] Cloud Functions デプロイ
- [ ] ドメイン設定
- [ ] SSL証明書設定
- [ ] 本番環境テスト

**合計開発期間目安: 4-6週間**

---

## 💰 コスト見積もり（Firebase）

### Firebaseの料金プラン
- **Spark Plan（無料）**: 開発・小規模運用に最適
  - Firestore: 50,000読み取り/日、20,000書き込み/日
  - Authentication: 無制限
  - Cloud Functions: 125,000呼び出し/月、40,000GB秒/月
  - Hosting: 10GB転送/月

- **Blaze Plan（従量課金）**: 本格運用向け
  - 使った分だけ課金
  - 講師10名、生徒100名程度の規模なら月額数百円〜数千円程度

### 推奨
- 開発段階: Spark Plan（無料）
- 本番運用: Blaze Plan（使用量に応じて）

---

## 🔐 セキュリティ対策

### 実装必須項目
1. **Firestore Security Rules**
   - ユーザーは自分のデータのみアクセス可能
   - 講師は自分の空き時間・予約のみ管理可能
   - 生徒は自分の予約のみ閲覧・キャンセル可能

2. **環境変数管理**
   - Firebase API Keyは`.env.local`で管理
   - `.gitignore`に`.env.local`を追加
   - Slack Webhook URLは暗号化して保存

3. **入力バリデーション**
   - フロントエンド: Zod スキーマでバリデーション
   - バックエンド: Cloud Functionsでも再検証

4. **認証ガード**
   - 各ページでユーザー認証状態をチェック
   - 権限に応じたアクセス制御

5. **XSS対策**
   - ユーザー入力はサニタイズ
   - Reactのデフォルト保護を活用

---

## 📝 次のアクション

実装を開始するために、以下を決めましょう：

### すぐに決める必要がある項目：
1. **キャンセル機能**: 必要ですか？何時間前までキャンセル可能にしますか？
2. **当日予約**: 当日予約は可能にしますか？最短何時間前まで？
3. **メール通知**: Slack通知に加えてメール通知も必要ですか？
4. **決済機能**: 有料の場合、決済機能は必要ですか？

### 開発開始の準備：
1. Firebaseプロジェクトを作成しますか？（一緒に進めることも可能です）
2. GitHubリポジトリは作成済みですか？
3. いつから開発を開始したいですか？

これらが決まれば、すぐにプロジェクトのセットアップから始められます！

