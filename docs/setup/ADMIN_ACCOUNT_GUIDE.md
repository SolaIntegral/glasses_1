# 管理者アカウント作成ガイド

## アプリケーションURL

**本番環境**: https://glasses1-582eb.web.app

## 管理者アカウントの作成方法

管理者アカウントはFirestoreで直接作成します。

### 方法1: Firebase Consoleから作成（推奨）

1. Firestore Consoleにアクセス
   - https://console.firebase.google.com/project/glasses1-582eb/firestore/databases/-default-/data

2. `users`コレクションを選択（存在しない場合は作成）

3. 「ドキュメントを追加」をクリック

4. ドキュメントID: `admin001`（任意の管理者ID）

5. 以下のフィールドを追加：
   ```
   displayName (文字列): 管理者
   role (文字列): admin
   hashedPassword (文字列): cGFzc3dvcmQxMjM= （password123をbase64エンコードしたもの）
   createdAt (タイムスタンプ): 現在の日時
   updatedAt (タイムスタンプ): 現在の日時
   ```

6. 「保存」をクリック

### パスワードの設定方法

デフォルトのパスワードは`password123`です。変更する場合は、以下のコマンドでbase64エンコードします：

```bash
# macOS/Linuxの場合
echo -n 'your_password' | base64

# 例: password123をエンコード
echo -n 'password123' | base64
# 出力: cGFzc3dvcmQxMjM=
```

または、オンラインのBase64エンコーダーを使用することもできます。

## 初回管理者アカウントの作成手順

最初の管理者アカウントを作成するには、以下の手順を実行します：

### 手順1: Firestoreでユーザーを作成

1. https://console.firebase.google.com/project/glasses1-582eb/firestore/databases/-default-/data にアクセス

2. コレクション「users」を選択（存在しない場合は「コレクション開始」をクリック）

3. 「ドキュメントを追加」をクリック

4. ドキュメントIDを入力（例: `admin001`）

5. 以下のフィールドを追加：
   - フィールド名: `displayName`、タイプ: 文字列、値: `管理者`
   - フィールド名: `role`、タイプ: 文字列、値: `admin`
   - フィールド名: `hashedPassword`、タイプ: 文字列、値: `cGFzc3dvcmQxMjM=`
   - フィールド名: `createdAt`、タイプ: タイムスタンプ、値: 現在の日時
   - フィールド名: `updatedAt`、タイプ: タイムスタンプ、値: 現在の日時

6. 「保存」をクリック

## ログイン方法

1. https://glasses1-582eb.web.app にアクセス
2. 「ログイン」ボタンをクリック
3. ユーザーIDとパスワードを入力
   - **ユーザーID**: `admin001`（作成時に設定したドキュメントID）
   - **パスワード**: `password123`（デフォルトパスワード）
4. 管理者ダッシュボードにリダイレクトされます

### デフォルトログイン情報

- **ユーザーID**: admin001
- **パスワード**: password123

## トラブルシューティング

### ログインできない

- ユーザーIDとパスワードが正しいか確認
- Firestoreでユーザー情報が正しく作成されているか確認
- `hashedPassword`フィールドが正しくbase64エンコードされているか確認
- ブラウザのコンソールでエラーを確認

### 管理者権限がない

- Firestoreの`role`フィールドが`admin`になっているか確認
- ページをリロードして再度ログインしてみる

## セキュリティ上の注意

- 管理者パスワードは強力なものを使用してください
- 管理者アカウントは最小限の人数に制限してください
- 定期的にパスワードを変更してください
