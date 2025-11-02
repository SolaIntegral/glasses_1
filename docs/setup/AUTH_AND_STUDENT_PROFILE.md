# 認証システムと生徒プロフィール機能

## 認証方法の構成

### 管理者のみFirebase Authenticationを使用
- 管理者のアカウントのみFirebase Authenticationに保存
- セキュアな認証が必要なため

### 生徒と講師はFirestoreで管理
- ユーザー情報はFirestoreに保存
- セッションベースの認証を使用
- パスワードはハッシュ化して保存

## 機能一覧

### 1. 講師のプロフィール表示機能（生徒向け）

生徒が講師の詳細情報を閲覧できる機能です。

**表示項目：**
- 講師名
- プロフィール画像
- 自己紹介（bio）
- 専門分野（specialties）
- アクティブステータス

**実装場所：**
- `/student/instructors` - 講師一覧
- `/student/instructors/[id]` - 講師詳細ページ

### 2. 生徒プロフィール情報（講師向け）

講師が面談前に生徒の情報を確認できる機能です。

**保存・表示される情報：**

1. **関心事・興味分野（interests）**
   - 生徒が設定した関心のある分野
   - 例: "転職活動", "キャリア相談", "スキルアップ"
   - **重要**: 生徒側からは編集できません（管理者のみが編集可能）

2. **過去の会話記録（previousConversations）**
   - これまでの面談内容の記録
   - 日付、担当講師、要約、トピック、次のステップ
   - **重要**: 講師のみが入力できます

3. **講師メモ（notes）**
   - 講師が生徒について記録したメモ
   - 面談前の準備に使用
   - **重要**: 講師のみが閲覧・編集可能

**データ構造：**

```typescript
interface StudentProfile {
  id: string;
  userId: string;
  interests: string[]; // 関心のある分野
  previousConversations: ConversationHistory[]; // 過去の会話記録
  notes?: string; // 講師用のメモ
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationHistory {
  date: Date;
  instructorId: string;
  instructorName: string;
  summary: string; // 面談内容の要約
  topics: string[]; // 話したトピック
  nextSteps?: string; // 次のステップ
}
```

**Firestore コレクション：**

```
/studentProfiles/{userId}
  - userId: string
  - interests: string[]
  - previousConversations: ConversationHistory[]
  - notes?: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### 3. 会議リンク機能

予約完了時に自動的に共通のGoogle Meetリンクが発行されます。

**実装：**
- 予約作成時に会議リンクを自動設定（`meetingUrl: 'https://meet.google.com/kdd-mtnd-eyc'`）
- 生徒は予約完了画面とマイ予約一覧から会議に参加可能
- 講師は予約一覧から会議に参加可能

### 4. セッション後レポート機能

生徒と講師がそれぞれ別のGoogle Formに入力します。

**生徒向けフォーム：**
- URL: https://forms.gle/KjE5SGKXC3tfpMZUA
- 予約完了画面からアクセス可能
- 感想やフィードバックを入力

**講師向けフォーム：**
- URL: https://forms.gle/jhn2674CETV3L3qN8
- 講師の予約一覧画面からアクセス可能
- セッション後の記録を入力

## 実装済み機能

### lib/firebase/studentProfiles.ts

以下の関数が実装されています：

1. `getStudentProfile(userId)` - 生徒プロフィールを取得
2. `updateStudentProfile(userId, data)` - 生徒プロフィールを更新
3. `addConversationHistory(userId, conversation)` - 会話記録を追加
4. `addInstructorNote(userId, note)` - 講師のメモを追加
5. `getAllStudentProfiles()` - 全ての生徒プロフィールを取得

### lib/firebase/bookings.ts

- 予約作成時に会議リンクを自動設定
- 共通のGoogle Meetリンクを使用

## セキュリティ

- 生徒プロフィールは本人とその生徒の予約を持つ講師のみアクセス可能
- 講師メモは講師のみが閲覧・編集可能
- 生徒は自分のプロフィール情報を編集できません（管理者のみ編集可能）
- Firebase Authenticationは管理者のみに使用

## 使用方法

### 生徒側

1. 講師一覧から講師を選択
2. 空き時間を選択して予約
3. 予約完了画面で会議リンクとセッション後レポートフォームのリンクを確認
4. セッション後、フォームに入力

### 講師側

1. 予約一覧で予約を確認
2. 会議リンクからセッションに参加
3. セッション後、レポートフォームに入力
4. 生徒の過去の会話記録を確認（実装予定）

