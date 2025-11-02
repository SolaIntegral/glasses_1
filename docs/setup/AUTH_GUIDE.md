# 🔐 認証システムガイド

## 概要

本システムは**ユーザーIDとパスワード**でログインできる認証システムです。
メールアドレスは不要で、プライバシーに配慮した設計になっています。

## マルチデバイス対応

### セッション管理

- **Firestore**にセッション情報を保存
- **localStorage**にはセッションIDのみ保存
- 複数の端末から同じアカウントでログイン可能
- セッションは30日間有効

### 動作フロー

1. ログイン時にFirestoreにセッションを作成
2. セッションIDをlocalStorageに保存
3. 以降はFirestoreからユーザー情報を取得
4. ログアウト時にFirestoreのセッションを削除

### セキュリティ

- 各セッションは独立したIDを持つ
- セッションには有効期限がある（30日）
- ログアウト時にセッションを削除

## ログインアカウント

現時点では、Firestoreに登録されているアカウントはありません。

以下の方法でアカウントを作成できます：

### 方法1: アプリから新規登録

1. ブラウザでアプリを開く
2. 「新規登録」をクリック
3. 以下の情報を入力：
   - 表示名
   - ユーザーID（英数字）
   - パスワード（6文字以上）
   - アカウント種類（生徒/講師）
4. 「登録」をクリック

### 方法2: 管理者が手動作成

管理者はFirestoreでユーザーを作成できます：

```javascript
// Firestoreにユーザーを作成
const usersRef = db.collection('users');
await usersRef.doc('testuser').set({
  displayName: 'テストユーザー',
  role: 'student', // 'student' | 'instructor' | 'admin'
  hashedPassword: Buffer.from('password123').toString('base64'),
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## セキュリティについて

### パスワードの保存

- パスワードは`base64`エンコードして保存されています
- 本番環境では、より強力なハッシュ化（bcrypt等）の使用を推奨します

### 認証フロー

1. ユーザーがユーザーIDとパスワードを入力
2. Firestoreからユーザー情報を取得
3. パスワードを検証
4. 認証成功時、Firestoreにセッションを作成
5. セッションIDをlocalStorageに保存
6. 以降のリクエストで、セッションIDを使ってFirestoreからユーザー情報を取得

### Firestoreのコレクション構成

```
/users/{userId}
  - displayName: string
  - role: string
  - hashedPassword: string
  - createdAt: timestamp
  - updatedAt: timestamp

/sessions/{sessionId}
  - userId: string
  - createdAt: timestamp
  - expiresAt: timestamp
  - deletedAt?: timestamp
```

## 主な変更点

### 従来（localStorageのみ）
- ユーザー情報をlocalStorageに保存
- 端末ごとにログイン状態が独立
- 他の端末でログインできない

### 現在（Firestoreセッション管理）
- セッション情報をFirestoreに保存
- 複数の端末からログイン可能
- セッション管理が可能

## テストアカウント作成例

### 生徒アカウント

```javascript
// Firestoreコンソールで実行
{
  "displayName": "山田太郎",
  "role": "student",
  "hashedPassword": "cGFzc3dvcmQxMjM=", // password123
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 講師アカウント

```javascript
// Firestoreコンソールで実行
{
  "displayName": "鈴木花子",
  "role": "instructor",
  "hashedPassword": "cGFzc3dvcmQxMjM=", // password123
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

また、講師の場合は`/instructors`コレクションにも作成が必要です：

```javascript
// Firestoreコンソールで実行
{
  "userId": "instructor001",
  "bio": "",
  "specialties": [],
  "profileImageUrl": "",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## トラブルシューティング

### ログインできない

1. Firestoreにユーザーが作成されているか確認
2. パスワードのハッシュが正しいか確認
3. ブラウザのコンソールでエラーメッセージを確認
4. Firestoreにセッションが作成されているか確認

### ログアウトできない

1. ブラウザの開発者ツールでlocalStorageを確認
2. `localStorage.removeItem('sessionId')`を手動で実行
3. Firestoreのセッションコレクションで手動削除

### 他の端末でログインできない

1. Firestoreの接続を確認
2. セッションがFirestoreに作成されているか確認
3. ネットワーク接続を確認
