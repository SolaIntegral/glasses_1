# ログイン問題のトラブルシューティング

## 🔍 症状

1. ログインボタンを押しても何も起こらない
2. リンクから入ると自動的に管理者画面に行ってしまう
3. localStorageをクリアしたい

## 🛠️ 調査手順

### ステップ1: ブラウザのコンソールでデバッグログを確認

1. **ブラウザでアプリを開く**: https://glasses1-582eb.web.app
2. **開発者ツールを開く**（F12キーまたは右クリック→検証）
3. **Consoleタブを選択**
4. **ページをリロード**し、以下のログを確認:

```
loadUser called
sessionId from localStorage: <sessionId or null>
```

#### シナリオA: sessionIdがnullでない場合

**症状**: 古いセッションが残っている

**対処法**:
```
console.log('sessionId from localStorage:', localStorage.getItem('sessionId'));
// 値が表示されたら
localStorage.clear();
// その後、ページをリロード
```

#### シナリオB: ログインを試みる場合

1. **ログインページ**（`/auth/login`）に移動
2. **ユーザーIDとパスワードを入力**
3. **ログインボタンをクリック**
4. **コンソールで以下のログを確認**:

```
Attempting to login with userId: <userId>
signIn called with userId: <userId>
User found, checking password...
Input hashedPassword: <hashed>
Stored hashedPassword: <hashed>
Password verified successfully
Login successful, user role: <role>
Redirecting to <dashboard>
```

5. **エラーが出た場合**: エラーメッセージをコピーして報告

### ステップ2: Firestoreのデータを確認

1. **Firestore Console**を開く:
   https://console.firebase.google.com/project/glasses1-582eb/firestore/databases/-default-/data

2. **usersコレクションを確認**:
   - ユーザーIDのドキュメントが存在するか
   - `role`フィールドが正しいか（admin/instructor/student）
   - `hashedPassword`フィールドが正しいか

3. **sessionsコレクションを確認**:
   - 古いセッションが残っていないか
   - 必要に応じて削除

### ステップ3: localStorageをクリア（簡単な方法）

#### 方法A: コンソールでクリア（推奨）

1. **ブラウザの開発者ツールでConsoleタブを開く**（F12キーまたは右クリック→検証→Consoleタブ）
2. **コンソールの一番下の `>` の後に以下をコピー&ペーストしてEnter**:

```javascript
localStorage.clear(); location.reload();
```

これでlocalStorageがクリアされ、ページがリロードされます。

#### 方法B: 手動でクリア

1. **ブラウザの開発者ツールでConsoleタブを開く**
2. **以下のコマンドを1つずつ実行**（コピー&ペーストしてEnterを押す）:

```javascript
localStorage.removeItem('sessionId');
```

```javascript
localStorage.clear();
```

```javascript
location.reload();
```

### ステップ4: 管理者アカウントが正しく作成されているか確認

Firestore Consoleで以下を確認:

**users コレクション**
```javascript
{
  displayName: "管理者",
  role: "admin",        // ← adminになっているか
  hashedPassword: "cGFzc3dvcmQxMjM=",  // ← password123
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
```

**パスワードの確認**:
```bash
# ターミナルで実行
echo -n 'password123' | base64
# 出力: cGFzc3dvcmQxMjM=
```

## 📝 よくある問題と対処法

### 問題1: ログインボタンを押しても何も起こらない

**原因**: JavaScriptエラーが発生している

**対処法**:
1. ブラウザのコンソールでエラーを確認
2. エラーメッセージをスクリーンショットまたはコピー
3. 以下を試す:
   - ハードリフレッシュ（Ctrl+Shift+R または Cmd+Shift+R）
   - ブラウザのキャッシュをクリア
   - 別のブラウザで試す

### 問題2: 自動的に管理者画面に飛んでしまう

**原因**: 古いセッションがlocalStorageに残っている

**対処法**:
```javascript
// コンソールで実行
localStorage.clear();
location.reload();
```

### 問題3: パスワードが正しくない

**原因**: Firestoreの`hashedPassword`フィールドが間違っている

**対処法**:
1. Firestore Consoleで該当ユーザーのドキュメントを開く
2. `hashedPassword`フィールドを確認
3. 正しいパスワードをbase64エンコードして設定

**パスワードをbase64エンコードする方法**:
```bash
# macOS/Linux
echo -n 'your_password' | base64

# 例: password123
echo -n 'password123' | base64
# 出力: cGFzc3dvcmQxMjM=
```

### 問題4: ユーザーが見つからない

**原因**: Firestoreにユーザーデータが存在しない

**対処法**:
1. Firestore Consoleで`users`コレクションを確認
2. ユーザーIDのドキュメントが存在するか確認
3. 存在しない場合は、管理者アカウント作成手順を実行:
   - `docs/setup/CREATE_FIRST_ADMIN.md` を参照

### 問題5: セッションが見つからない

**原因**: Firestoreの`sessions`コレクションにセッションが存在しない

**対処法**:
1. 一度ログアウトを試す
2. localStorageをクリア
3. 再度ログインを試す

## 🔧 手動でログアウトする方法

ブラウザのコンソール（F12でConsoleタブを開く）で以下を実行:

```javascript
localStorage.clear(); location.reload();
```

**注意**: コピー&ペーストした後、必ずEnterキーを押してください。

## 📞 問題が解決しない場合

以下の情報を収集して報告してください:

1. **ブラウザの種類とバージョン**
2. **コンソールのエラーメッセージ**（スクリーンショット）
3. **Firestoreのデータ**（usersコレクション、sessionsコレクション）
4. **実行したコマンドとその結果**

## 🔗 関連ドキュメント

- **管理者アカウント作成**: `docs/setup/CREATE_FIRST_ADMIN.md`
- **Firestoreセットアップ**: `docs/setup/FIRESTORE_SETUP_GUIDE.md`
- **認証ガイド**: `docs/setup/AUTH_GUIDE.md`

## ⚠️ 注意

現在、デバッグログが有効になっています。本番環境では、これらのログを削除することを推奨します。

