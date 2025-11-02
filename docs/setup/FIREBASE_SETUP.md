# Firebase設定ガイド

## 現在のFirebase設定

以下のFirebase設定が適用されています：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBhJvfBU2LNYlXaxwcZ8aR49nMGG2AV0MM",
  authDomain: "glasses1-582eb.firebaseapp.com",
  projectId: "glasses1-582eb",
  storageBucket: "glasses1-582eb.firebasestorage.app",
  messagingSenderId: "481608487323",
  appId: "1:481608487323:web:a09edd74e0e39aff5a113e",
  measurementId: "G-3L660DR8CM"
};
```

## プロジェクト情報
- **プロジェクトID**: glasses1-582eb
- **Firebase Console**: https://console.firebase.google.com/project/glasses1-582eb

## Firebase Consoleでの設定

1. **Firebase Console**にアクセス
2. プロジェクトを作成または選択
3. **Authentication**を有効化
   - メール/パスワード認証を有効化
4. **Firestore Database**を作成
   - セキュリティルールを設定
5. **Storage**を有効化（必要に応じて）

## Firestoreセキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザー情報
    match /users/{userId} {
      allow read, write: if} request.auth != null && request.auth.uid == userId;
    }
    
    // 講師情報
    match /instructors/{instructorId} {
      allow read: if true; // 全員が読み取り可能
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 空き時間
    match /availableSlots/{slotId} {
      allow read: if true; // 全員が読み取り可能
      allow write: if request.auth != null;
    }
    
    // 予約
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.studentId || 
         request.auth.uid == resource.data.instructorId);
    }
    
    // 通知
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## データ構造

### users コレクション
```javascript
{
  displayName: string,
  role: 'student' | 'instructor' | 'admin',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### instructors コレクション
```javascript
{
  userId: string,
  displayName: string,
  specialties: string[],
  bio: string,
  profileImageUrl: string,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### availableSlots コレクション
```javascript
{
  instructorId: string,
  startTime: Timestamp,
  endTime: Timestamp,
  isBooked: boolean,
  bookingId: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### bookings コレクション
```javascript
{
  instructorId: string,
  studentId: string,
  slotId: string,
  startTime: Timestamp,
  endTime: Timestamp,
  purpose: string,
  notes: string,
  status: 'confirmed' | 'cancelled',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### notifications コレクション
```javascript
{
  userId: string,
  title: string,
  message: string,
  type: 'booking' | 'cancellation' | 'reminder' | 'system',
  bookingId: string | null,
  isRead: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 管理者アカウントの作成

管理者アカウントを作成するには、Firebase ConsoleのAuthenticationで手動でユーザーを作成し、Firestoreでroleを'admin'に設定してください。
