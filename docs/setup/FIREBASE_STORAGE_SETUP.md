# Firebase Storage セットアップガイド

画像アップロード機能を使用するために、Firebase Storage を設定する必要があります。

## セットアップ手順

### 1. Firebase ConsoleでStorageを有効化

1. [Firebase Console](https://console.firebase.google.com/project/glasses1-582eb/storage) にアクセス
2. 「Get Started」ボタンをクリック
3. セキュリティルールの確認：
   - 「Start in test mode」を選択してもOK（後でルールをデプロイします）
   - 「Next」をクリック
4. ロケーションの選択：
   - 「すべてのロケーション」のラジオボタンを選択
   - ドロップダウンから「asia-northeast1 (Tokyo)」を選択
   - アクセス頻度は「標準」のまま
   - 「続行」をクリック
   - 次の画面で「完了」をクリック

**注意**: 「料金不要のロケーション」という表示は、特定のロケーションが無料という意味ではありません。Firebase Storage の無料枠（月5GB）はどのロケーションでも適用されます。

### 2. Storageルールをデプロイ

プロジェクトルートで以下のコマンドを実行：

```bash
firebase deploy --only storage
```

これで `storage.rules` ファイルの内容がデプロイされ、以下の設定が適用されます：
- 講師プロフィール画像: 本人のみ書き込み可能、誰でも読み取り可能
- その他のファイル: 認証済みユーザーのみ書き込み可能、誰でも読み取り可能

### 3. CORS設定（必要な場合）

Firebase Storage は通常、デフォルトで適切な CORS 設定がされていますが、問題が続く場合は以下を確認：

1. Firebase Console > Storage > Settings
2. 「CORS」タブを確認
3. 必要に応じて、以下のような CORS 設定を追加：

```
[
  {
    "origin": ["https://glasses1-582eb.web.app"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

ただし、通常は CORS の手動設定は不要です。

## トラブルシューティング

### CORS エラーが発生する場合

1. ブラウザのコンソールでエラーメッセージを確認
2. Storage が正しく有効化されているか確認
3. `firebase deploy --only storage` を再実行
4. ブラウザのキャッシュをクリア

### 画像アップロードが失敗する場合

1. ファイルサイズを確認（5MB以下）
2. 画像形式を確認（JPG, PNG, GIF など）
3. ネットワーク接続を確認
4. ブラウザのコンソールで詳細なエラーメッセージを確認

## 確認方法

1. 講師アカウントでログイン
2. プロフィール画面に移動
3. 「写真を変更する」ボタンをクリック
4. 画像ファイルを選択
5. アップロードが成功することを確認

成功した場合、プロフィール画像が表示され、「アップロード中...」のテキストが「写真を変更する」に戻ります。

