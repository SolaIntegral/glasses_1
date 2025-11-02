# Firebase Storage セットアップ手順

画像アップロード機能を使用するには、Firebase Storage を有効化する必要があります。

## 💰 料金について

**Firebase Storage は無料枠が充実しています！**

詳しくは [Firebase 料金ページ](https://firebase.google.com/pricing?hl=ja) をご確認ください。

### 無料枠（Spark Plan または Blaze Plan の無料枠）

- **ストレージ**: 月5GBまで無料
- **ダウンロード**: 月100GBまで無料
- **アップロード操作**: 月5,000回まで無料
- **ダウンロード操作**: 月50,000回まで無料

### 想定される使用量

講師プロフィール画像として想定される使用量（講師10名想定）：

- 1枚あたり500KB〜1MBと仮定
- 10名 × 1MB = **約10MB** (0.01GB)
- これは無料枠の **0.2%** 程度です

**結論**: 小規模な運用であれば**完全無料**で使用可能です！

### 注意点

Firebase Storage を使用するには、Firebase プロジェクトが **Blaze Plan（従量課金制）** にアップグレードされている必要があります。

しかし、**無料枠内の使用であれば課金は発生しません**。

詳しくは：
- [Firebase 料金ページ](https://firebase.google.com/pricing?hl=ja)
- 無料枠内であれば Blaze Plan にアップグレードしても課金は発生しません

## 手順

### 1. Firebase ConsoleでStorageを有効化

以下のリンクから Firebase Storage を有効化してください：

**→ [Firebase Console: Storage](https://console.firebase.google.com/project/glasses1-582eb/storage)**

手順：
1. 「Get Started」ボタンをクリック
2. 「Start in test mode」を選択（後でルールをデプロイします）
3. 「Next」をクリック
4. **ロケーションの選択**：
   - 「すべてのロケーション」のラジオボタンを選択
   - ドロップダウンから「**asia-northeast1 (Tokyo)**」を選択
   - アクセス頻度は「標準」のまま
5. 「続行」をクリック
6. セキュリティルールの確認画面で「完了」をクリック

**注意**: 「料金不要のロケーション」という表示は、特定のロケーションが無料という意味ではありません。Firebase Storage の無料枠（月5GB）はどのロケーションでも適用されます。`asia-northeast1` を選択しても、無料枠内であれば課金は発生しません。

### 2. StorageルールとFirestoreインデックスをデプロイ

Storage を有効化したら、以下のコマンドを実行してください：

```bash
cd /Users/sora/develop/glasses_1
firebase deploy --only storage,firestore:indexes
```

これで `storage.rules` と `firestore.indexes.json` がデプロイされ、適切な設定が適用されます。

**注意**: Firestore インデックスの作成には数分かかる場合があります。

### 3. 確認

1. 講師アカウントでログイン
2. プロフィール画面に移動
3. 「写真を変更する」ボタンをクリック
4. 画像ファイルを選択
5. アップロードが成功することを確認

## トラブルシューティング

### まだ CORS エラーが出る場合

ブラウザのキャッシュをクリアしてください：
- Mac: Cmd + Shift + R
- Windows/Linux: Ctrl + Shift + R

または、シークレットモードで試してください。

### その他の問題

詳細は `docs/setup/FIREBASE_STORAGE_SETUP.md` を参照してください。

