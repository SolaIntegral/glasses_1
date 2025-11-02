# 講師データの流れ

## 📊 データ構造

### users コレクション

- **ドキュメントID**: ユーザーID（例: `instructor001`）
- **フィールド**:
  - `displayName`: 講師名
  - `role`: `instructor`
  - `hashedPassword`: base64エンコードされたパスワード
  - `createdAt`: 作成日時
  - `updatedAt`: 更新日時

### instructors コレクション

- **ドキュメントID**: ユーザーIDと同じ（例: `instructor001`）
- **フィールド**:
  - `userId`: ユーザーID（ドキュメントIDと同じ）
  - `bio`: 自己紹介
  - `specialties`: 専門分野（配列）
  - `slackMemberId`: SlackメンバーID
  - `profileImageUrl`: プロフィール画像URL
  - `isActive`: 有効/無効フラグ
  - `meetingUrl`: MTG用URL（追加フィールド）
  - `gender`: 性別（追加フィールド）
  - `currentIndustry`: 現在の業界（追加フィールド）
  - `currentOccupation`: 現在の業種（追加フィールド）
  - `currentJobTitle`: 現在の職種（追加フィールド）
  - `education`: 学歴（配列、追加フィールド）
  - `workHistory`: 経歴（配列、追加フィールド）
  - `hobbies`: 趣味（配列、追加フィールド）
  - `highSchoolClub`: 高校時所属していた部活（追加フィールド）
  - `messageToStudents`: 高校生へひとこと（追加フィールド）
  - `createdAt`: 作成日時
  - `updatedAt`: 更新日時

## 🔄 データフロー

### 1. 講師アカウント作成

**ファイル**: `app/admin/instructors/new/page.tsx`

**処理**:
1. `users`コレクションにドキュメントを作成（ドキュメントID = ユーザーID）
2. `instructors`コレクションにドキュメントを作成（ドキュメントID = ユーザーID）

**重要**: 両方のドキュメントIDは同じでなければならない。

### 2. 講師情報取得（通常）

**ファイル**: `lib/firebase/instructors.ts` → `getInstructor(userId: string)`

**処理**:
1. `instructors`コレクションを`where('userId', '==', userId)`で検索
2. ドキュメントが見つかったらデータを返す
3. 見つからない場合は`null`を返す

**用途**: ログイン後の講師プロフィール表示

### 3. 講師情報取得（管理者用 - document IDで取得）

**ファイル**: `lib/firebase/instructors.ts` → `getInstructorByDocId(docId: string)`

**処理**:
1. `instructors`コレクションから直接ドキュメントIDで取得
2. ドキュメントが見つかったらデータを返す
3. 見つからない場合は`null`を返す

**用途**: 管理者画面での講師情報編集

### 4. 講師一覧取得（管理者画面）

**ファイル**: `app/admin/instructors/page.tsx` → `fetchInstructors()`

**処理**:
1. `users`コレクションから全ドキュメントを取得
2. `role === 'instructor'`のドキュメントをフィルタリング
3. 各ドキュメントに対して、`instructors`コレクションから同じドキュメントIDでデータを取得
4. 結合して返す

**用途**: 管理者画面での講師一覧表示

## ⚠️ 重要な注意点

### ドキュメントIDの一貫性

**必須**: `users`と`instructors`のドキュメントIDは同じでなければならない。

**理由**:
- 管理者画面で講師一覧を取得する際、`users`のドキュメントIDを使って`instructors`からデータを取得している
- ドキュメントIDが異なると、講師詳細情報が取得できなくなる

### getInstructor vs getInstructorByDocId

**getInstructor**:
- 内部で`where('userId', '==', userId)`クエリを使用
- インデックスが必要になる場合がある
- Firestoreの検索制限がある

**getInstructorByDocId**:
- document IDで直接取得するため高速
- インデックス不要
- 推奨される方法

**推奨**: ドキュメントIDがわかっている場合は`getInstructorByDocId`を使用

### データの同期

現在の実装では、`users`と`instructors`の両方に`displayName`が保存されていない。

- `users.displayName`: 講師名（必須）
- `instructors.displayName`: 設定されていない

これは問題になる可能性があるため、将来的には以下のいずれかで統一することを推奨:

1. `instructors`にも`displayName`を保存する
2. または、`instructors`から削除して常に`users`から取得する

## 🔍 検証方法

### 正常なケース

1. 講師を作成: `users`と`instructors`に同じドキュメントIDで作成される
2. ログイン: `getInstructor(userId)`で`instructors`からデータを取得できる
3. プロフィール表示: データが表示される
4. 管理者画面: 一覧に表示される

### 異常なケース

1. `users`のみ存在: ログインできるが、プロフィールが表示されない
2. `instructors`のみ存在: ログインできない
3. ドキュメントIDが異なる: 管理者画面で詳細情報が取得できない

## 📝 トラブルシューティング

### 問題: ログインできるがプロフィールが表示されない

**原因**: `instructors`コレクションにドキュメントが存在しない

**確認方法**:
```
Firestore Console → instructors → ドキュメントIDを確認
```

**対処法**:
1. 管理者画面で講師を作成し直す
2. または、Firestore Consoleで手動で`instructors`コレクションにドキュメントを作成

### 問題: 管理者画面で講師詳細が表示されない

**原因**: `users`と`instructors`のドキュメントIDが異なる

**確認方法**:
```
Firestore Console → users → ドキュメントIDを確認
Firestore Console → instructors → ドキュメントIDを確認
両方が同じであることを確認
```

**対処法**:
1. 新しい講師を作成し直す
2. または、Firestore Consoleで手動で修正

## 🔗 関連ドキュメント

- **講師作成検証**: `docs/INSTRUCTOR_CREATION_VERIFICATION.md`
- **Firestore設定**: `docs/setup/FIRESTORE_SETUP_GUIDE.md`
- **トラブルシューティング**: `docs/FIX_INSTRUCTOR001_ERROR.md`

