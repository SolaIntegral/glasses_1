# Firebase Hosting デプロイガイド

## 前提条件

- Node.js v18以上がインストールされていること
- Firebase CLIがインストールされていること
- Firebaseプロジェクトが作成されていること

## 1. Firebase CLIのインストール

まだインストールしていない場合：

```bash
npm install -g firebase-tools
```

## 2. Firebaseにログイン

```bash
firebase login
```

ブラウザが開くので、Googleアカウントでログインしてください。

## 3. Firebaseプロジェクトの作成

Firebase Console (https://console.firebase.google.com/) で新しいプロジェクトを作成します。

プロジェクト名の例: `booking-system-dev`

## 4. プロジェクトの初期化

プロジェクトディレクトリで以下を実行：

```bash
cd /Users/sora/develop/glasses_1
firebase init hosting
```

以下のように選択：
- **Use an existing project** を選択
- 作成したプロジェクトを選択
- **What do you want to use as your public directory?** → `out` と入力
- **Configure as a single-page app?** → `Yes`
- **Set up automatic builds with GitHub?** → `No`

## 5. ビルド

```bash
npm run build
```

Next.jsが静的サイトを `out` ディレクトリに出力します。

## 6. デプロイ

```bash
firebase deploy --only hosting
```

デプロイが完了すると、Hosting URLが表示されます：
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-project.web.app
```

## 7. デプロイされたサイトにアクセス

表示されたURLをブラウザで開いてください。

---

## 注意事項

### 静的エクスポートの制限

- サーバーサイドレンダリング (SSR) は使用できません
- API Routes は使用できません
- すべてクライアントサイドで動作します

### 管理者アカウント

初回アクセス時に自動的に作成されます：
- **ユーザーID**: `admin`
- **パスワード**: `admin123`

### データの永続化

現在の実装ではブラウザの `localStorage` を使用しているため：
- データはブラウザごとに独立しています
- ブラウザのキャッシュをクリアするとデータが消えます
- 本番環境ではFirebase Firestoreへの移行を推奨します

---

## トラブルシューティング

### ビルドエラーが出る場合

```bash
# キャッシュをクリア
rm -rf .next out

# 再ビルド
npm run build
```

### デプロイエラーが出る場合

```bash
# Firebase CLIを再認証
firebase logout
firebase login

# 再デプロイ
firebase deploy --only hosting
```

---

## 更新デプロイ

コードを修正した後：

```bash
# 1. ビルド
npm run build

# 2. デプロイ
firebase deploy --only hosting
```

---

## カスタムドメインの設定

Firebase Console → Hosting → カスタムドメインを追加

詳細: https://firebase.google.com/docs/hosting/custom-domain

