# Googleカレンダー連携セットアップガイド

## 概要

予約システムとGoogleカレンダーを連携させ、予約作成時に共通のGoogleカレンダーに自動的にイベントを追加します。各予約には講師のMTGリンクが含まれます。

## 前提条件

- Google Cloud プロジェクト
- Firebase プロジェクト
- Google Calendar API の有効化

## セットアップ手順

### 1. Google Cloud Console での設定

#### 1-1. Google Calendar API を有効化

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択
3. 「APIとサービス」→「ライブラリ」に移動
4. "Google Calendar API" を検索
5. 「有効にする」をクリック

#### 1-2. サービスアカウントを作成

1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例: `calendar-integration`）
4. 「作成して続行」をクリック
5. ロールは「編集者」を選択（または必要な権限）
6. 「完了」をクリック

#### 1-3. サービスアカウントキーをダウンロード

1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「キーを追加」→「新しいキーを作成」
4. キーのタイプ: JSON を選択
5. 「作成」をクリック（JSONファイルがダウンロードされます）

#### 1-4. 共通カレンダーを作成・共有設定

1つの共通のGoogleカレンダーを作成し、サービスアカウントにアクセス権限を付与します。

1. Googleカレンダーを開く（https://calendar.google.com/）
2. 左側の「+」ボタンから「新しいカレンダーを作成」をクリック
3. カレンダー名を入力（例: 「予約システム」）
4. 「カレンダーを作成」をクリック
5. 作成したカレンダーの「設定と共有」を開く
6. 「ユーザーを追加」をクリック
7. サービスアカウントのメールアドレスを入力（JSONファイル内の `client_email`）
8. 権限を「変更して共有を管理」または「変更」に設定
9. 「送信」をクリック
10. カレンダーIDを確認（設定ページの「カレンダーの統合」セクションに表示）

### 2. Firebase Functions の設定

#### 2-1. サービスアカウントキーとカレンダーIDを Firebase Functions の設定に追加

ダウンロードしたJSONファイルの内容と共通カレンダーIDを Firebase Functions の設定として保存します。

```bash
# サービスアカウントキーを設定（JSONファイルの内容をそのまま設定）
firebase functions:config:set google.service_account_key="$(cat path/to/service-account-key.json)"

# 共通カレンダーIDを設定（例: xxxxx@group.calendar.google.com または メールアドレス）
firebase functions:config:set google.calendar_id="your-calendar-id@group.calendar.google.com"
```

または、環境変数として設定する場合：

```bash
firebase functions:config:set google.service_account_email="your-service-account@project.iam.gserviceaccount.com"
firebase functions:config:set google.calendar_id="your-calendar-id@group.calendar.google.com"
```

**カレンダーIDの確認方法**:
1. Googleカレンダーの設定ページを開く
2. 対象のカレンダーの「設定と共有」を開く
3. 「カレンダーの統合」セクションを開く
4. 「カレンダーID」をコピー（例: `xxxxx@group.calendar.google.com`）

#### 2-2. 依存関係をインストール

```bash
cd functions
npm install googleapis
```

#### 2-3. Functions をデプロイ

```bash
cd functions
npm run build
firebase deploy --only functions
```

### 3. 講師情報の設定

#### 3-1. メールアドレスの追加（オプション）

講師の `users` コレクションにメールアドレスを追加すると、カレンダーイベントの参加者として追加されます：

```javascript
// Firestore Console または管理画面から
users/{instructorId}
  - email: "instructor@example.com"
```

#### 3-2. MTGリンクの設定

講師の `instructors` コレクションに `meetingUrl` を設定すると、カレンダーイベントにMTGリンクが含まれます：

```javascript
instructors/{instructorId}
  - meetingUrl: "https://meet.google.com/xxx-xxxx-xxx"
```

**注意**: 全ての予約は1つの共通カレンダーに追加されます。講師ごとの個別カレンダーは使用しません。

## 動作確認

### 予約作成時の動作

1. 生徒が予約を作成
2. Firestore の `bookings` コレクションに予約が作成される
3. `onCreateBooking` 関数がトリガーされる
4. **共通のGoogleカレンダー**にイベントが自動追加される
5. イベントには講師名、生徒名、講師のMTGリンクが含まれる
6. 予約データに `googleCalendarEventId` と `googleCalendarLink` が保存される

### 予約キャンセル時の動作

1. 予約がキャンセルされる（`status` が `cancelled` に変更）
2. `onUpdateBooking` 関数がトリガーされる
3. Googleカレンダーのイベントが削除される
4. 参加者にキャンセル通知が送信される

## トラブルシューティング

### エラー: "Calendar API credentials not configured"

**原因**: Firebase Functions の設定にサービスアカウント情報が設定されていない

**解決方法**:
```bash
firebase functions:config:get
# 設定が空の場合は、上記の手順2-1を実行
```

### エラー: "Shared calendar ID not configured"

**原因**: 共通カレンダーIDがFirebase Functionsの設定に設定されていない

**解決方法**: 
1. Firebase Functionsの設定を確認：
   ```bash
   firebase functions:config:get
   ```
2. カレンダーIDを設定：
   ```bash
   firebase functions:config:set google.calendar_id="your-calendar-id@group.calendar.google.com"
   ```

### エラー: "Insufficient Permission"

**原因**: サービスアカウントに共通カレンダーへのアクセス権限がない

**解決方法**: 手順1-4を実行して、共通カレンダーにサービスアカウントを共有

### イベントが作成されない

1. Firebase Functions のログを確認：
   ```bash
   firebase functions:log
   ```

2. エラーメッセージを確認
3. サービスアカウントの権限を確認
4. Google Calendar API が有効になっているか確認

## 注意事項

- サービスアカウントのJSONファイルは機密情報です。Gitにコミットしないでください
- **共通カレンダー1つにサービスアカウントを共有**する必要があります（各講師のカレンダーは不要）
- カレンダーIDは `xxxxx@group.calendar.google.com` 形式のIDを使用してください
- 全ての予約は1つの共通カレンダーに追加されます
- 各予約には講師のMTGリンクが含まれます

## 参考リンク

- [Google Calendar API ドキュメント](https://developers.google.com/calendar/api/v3/reference)
- [Firebase Functions 設定](https://firebase.google.com/docs/functions/config-env)
- [サービスアカウント認証](https://cloud.google.com/docs/authentication/production)

