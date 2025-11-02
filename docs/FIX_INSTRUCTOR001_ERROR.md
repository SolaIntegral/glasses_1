# instructor001エラーの対処法

## 🐛 問題

`instructor001` でログインすると「ユーザーが見つかりません」というエラーが出ます。

```
User not found: instructor001
Login error: Error: ユーザーが見つかりません
```

## ✅ 原因

`instructor001` というユーザーが**Firestoreに存在しない**ためです。

コンソールを見ると:
- ❌ `instructor001` → エラー（存在しない）
- ✅ `instructor0` → 成功（存在する）

現在のFirestoreには、設定時に作成した講師アカウントのみが存在しています。

## 🔧 解決方法

### 方法1: 新しく講師アカウントを作成する（推奨）

1. **管理者でログイン**:
   - URL: https://glasses1-582eb.web.app
   - ユーザーID: `admin001`
   - パスワード: `password123`

2. **講師管理ページに移動**:
   - メニューから「講師管理」をクリック
   - または直接: https://glasses1-582eb.web.app/admin/instructors

3. **新しい講師を作成**:
   - 「新規作成」ボタンをクリック
   - または直接: https://glasses1-582eb.web.app/admin/instructors/new
   - 以下の情報を入力:
     - **表示名**: 任意（例: `講師001`）
     - **ユーザーID**: 自動生成されるか、手動入力
     - **パスワード**: 自動生成されるか、手動入力
     - **Slack Member ID**（オプション）: SlackのメンバーID

4. **作成完了**:
   - ユーザーIDとパスワードが表示されます
   - これをコピーして保存してください

### 方法2: instructor001を手動でFirestoreに作成

もし既存のIDを使用したい場合は、Firestore Consoleから手動で作成してください。

1. **Firestore Consoleを開く**:
   https://console.firebase.google.com/project/glasses1-582eb/firestore/databases/-default-/data

2. **`users`コレクションを選択**

3. **`instructor001`というドキュメントIDで新規作成**:
   - 「ドキュメントを追加」をクリック
   - ドキュメントID: `instructor001`

4. **以下のフィールドを追加**:

#### フィールド1: displayName
- フィールド名: `displayName`
- タイプ: 文字列
- 値: `講師001`

#### フィールド2: role
- フィールド名: `role`
- タイプ: 文字列
- 値: `instructor`

#### フィールド3: hashedPassword
- フィールド名: `hashedPassword`
- タイプ: 文字列
- 値: パスワードをbase64エンコードしたもの

**パスワードをbase64エンコードする方法**:
```bash
# ターミナルで実行
echo -n 'your_password' | base64

# 例: パスワードが password123 の場合
echo -n 'password123' | base64
# 出力: cGFzc3dvcmQxMjM=
```

#### フィールド4: createdAt
- フィールド名: `createdAt`
- タイプ: タイムスタンプ
- 値: 現在の日時（設定ボタンをクリック）

#### フィールド5: updatedAt
- フィールド名: `updatedAt`
- タイプ: タイムスタンプ
- 値: 現在の日時（設定ボタンをクリック）

5. **`instructors`コレクションも作成**:
   - `instructors`コレクションを選択
   - 同じドキュメントID `instructor001` で作成

#### instructorsコレクションのフィールド:
- `userId`: `instructor001`
- `bio`: 空文字列または任意のテキスト
- `specialties`: 配列（例: `["プログラミング", "Web開発"]`）
- `profileImageUrl`: 空文字列
- `slackMemberId`: 空文字列またはSlackのメンバーID
- `isActive`: true
- `createdAt`: 現在の日時
- `updatedAt`: 現在の日時

6. **保存**してログインを試す

## 🎯 推奨アプローチ

**方法1（管理者画面から作成）を推奨します**。理由:
- ✅ 簡単で確実
- ✅ パスワードが自動生成される
- ✅ 必要なフィールドが自動的に設定される
- ✅ 両方のコレクション（users, instructors）が自動的に作成される

## 📝 注意事項

- 作成したユーザーIDとパスワードは必ず保存してください
- 一度作成したユーザーIDは変更できません
- 管理者画面から作成した講師は、すぐにログイン可能です

## 🔗 関連ドキュメント

- **管理者アカウント作成**: `docs/setup/CREATE_FIRST_ADMIN.md`
- **ログイン問題のトラブルシューティング**: `docs/TROUBLESHOOTING_LOGIN.md`
- **Firestoreセットアップ**: `docs/setup/FIRESTORE_SETUP_GUIDE.md`

