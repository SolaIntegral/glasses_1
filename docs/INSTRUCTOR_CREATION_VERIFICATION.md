# 講師アカウント作成の検証ガイド

## 📋 目的

管理者画面からの講師アカウント作成機能が、Firestoreに正しくデータを保存しているかを検証する。

## 🔍 検証手順

### ステップ1: 講師アカウントを作成

1. **管理者でログイン**:
   - URL: https://glasses1-582eb.web.app
   - ユーザーID: `admin001`
   - パスワード: `password123`

2. **講師管理ページに移動**:
   - 「講師管理」をクリック
   - または直接: https://glasses1-582eb.web.app/admin/instructors

3. **新規作成ボタンをクリック**:
   - 「新規講師アカウント発行」ボタンをクリック
   - または直接: https://glasses1-582eb.web.app/admin/instructors/new

4. **フォームに入力**:
   - **講師名**: `テスト講師`（必須）
   - **講師ID**: 空欄（自動生成される）
   - **パスワード**: 「パスワードを自動生成する」にチェック
   - **SlackメンバーID**: 任意

5. **「登録する」ボタンをクリック**

6. **コンソールログを確認**:
   - F12キーで開発者ツールを開く
   - Consoleタブを選択
   - 以下のログが表示されることを確認:

```
Creating instructor account...
finalUserId: instructor<timestamp>
displayName: テスト講師
Creating users document...
Users document created
Creating instructors document...
Instructors document created
Account creation completed successfully
```

### ステップ2: Firestoreでデータを確認

1. **Firestore Consoleを開く**:
   https://console.firebase.google.com/project/glasses1-582eb/firestore/databases/-default-/data

2. **`users`コレクションを確認**:
   - コレクションを選択
   - 作成した講師のドキュメントID（例: `instructor1234567890`）を見つける
   - 以下のフィールドが存在することを確認:

```
displayName: テスト講師
role: instructor
hashedPassword: <base64エンコードされたパスワード>
createdAt: <現在のタイムスタンプ>
updatedAt: <現在のタイムスタンプ>
```

3. **`instructors`コレクションを確認**:
   - コレクションを選択
   - 同じドキュメントIDのドキュメントが存在することを確認
   - 以下のフィールドが存在することを確認:

```
userId: instructor1234567890
bio: (空文字列)
specialties: (空配列)
slackMemberId: (空文字列または入力した値)
profileImageUrl: (空文字列)
isActive: true
createdAt: <現在のタイムスタンプ>
updatedAt: <現在のタイムスタンプ>
```

### ステップ3: ログインを試す

1. **管理者からログアウト**

2. **作成した講師でログイン**:
   - URL: https://glasses1-582eb.web.app/auth/login
   - ユーザーID: 作成時に表示されたID（例: `instructor1234567890`）
   - パスワード: 作成時に表示されたパスワード

3. **ログイン成功を確認**:
   - 講師ダッシュボードにリダイレクトされる
   - エラーが出ない

### ステップ4: プロフィールページを確認

1. **講師ダッシュボードで「プロフィール」をクリック**

2. **プロフィールページが表示されることを確認**:
   - エラーメッセージ「プロフィール情報が存在しません...」が表示される
   - フォームが表示される
   - 入力フィールドがすべて表示される

## ✅ 正常な動作

- `users`コレクションにドキュメントが作成される
- `instructors`コレクションにドキュメントが作成される
- 両方のドキュメントIDが同じである
- ログインできる
- プロフィールページでエラーメッセージが表示される（データがまだ空のため）

## ❌ よくある問題

### 問題1: `users`コレクションには作成されるが`instructors`に作成されない

**原因**: Firestoreの権限エラーまたはネットワークエラー

**確認方法**:
- コンソールに「Creating instructors document...」のログが出ているか
- 「Instructors document created」のログが出ているか
- エラーログが出ていないか

**対処法**:
- Firestore Consoleで手動で`instructors`コレクションにドキュメントを作成
- または、一度削除して再度作成を試す

### 問題2: 両方のコレクションに作成されるが、ログインできない

**原因**: パスワードのハッシュ化に問題がある、またはセッション作成に失敗している

**確認方法**:
- コンソールにログインエラーが出ていないか
- Firestoreの`users`コレクションの`hashedPassword`フィールドが正しいか

**対処法**:
```bash
# ターミナルでパスワードをbase64エンコード
echo -n 'your_password' | base64
```
- Firestore Consoleで`hashedPassword`フィールドを更新

### 問題3: プロフィールページが「読み込み中...」のまま

**原因**: `instructors`コレクションにドキュメントが存在しない

**確認方法**:
- Firestore Consoleで`instructors`コレクションを確認
- ドキュメントが存在しない場合は、ステップ2を再実行

## 📝 検証チェックリスト

- [ ] コンソールに全ログが表示される
- [ ] `users`コレクションにドキュメントが作成される
- [ ] `instructors`コレクションにドキュメントが作成される
- [ ] 両方のドキュメントIDが同じである
- [ ] ログインできる
- [ ] プロフィールページが表示される
- [ ] エラーメッセージが表示される（データが空のため）

## 🔗 関連ドキュメント

- **Firestore設定**: `docs/setup/FIRESTORE_SETUP_GUIDE.md`
- **トラブルシューティング**: `docs/TROUBLESHOOTING_LOGIN.md`
- **講師プロフィール問題**: `docs/FIX_INSTRUCTOR001_ERROR.md`

