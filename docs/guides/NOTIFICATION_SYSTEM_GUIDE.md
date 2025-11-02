# 通知システムガイド（無料版）

## 概要

**完全無料**で動作する通知システムです。Firestore通知機能を使用して、予約に関する通知を講師に届けます。

## 仕組み

```
予約イベント発生
    ↓
Firestoreに通知データを作成
    ↓
講師がアプリで通知を確認
```

Cloud FunctionsやSlackは不要です。**Firestore の Spark プラン（無料）で動作します。**

## 実装されている通知機能

### 1. 予約確定時の通知 ✅

- **タイミング**: 生徒が予約を作成した時
- **通知内容**: 生徒名、日時、目的
- **表示場所**: 講師の通知一覧ページ

### 2. 予約キャンセル時の通知 ✅

- **タイミング**: 予約がキャンセルされた時
- **通知内容**: キャンセルされた予約の日時
- **表示場所**: 講師の通知一覧ページ

### 3. セッション前リマインド ⏰（実装予定）

- **タイミング**: セッション開始の24時間前
- **通知内容**: 明日の予約をリマインド
- **実装方法**: 定期的に通知を作成する処理（クライアント側で実装）

### 4. セッション後リマインダー 📝（実装予定）

- **タイミング**: セッション終了後
- **通知内容**: レポート入力催促
- **実装方法**: 定期的に通知を作成する処理（クライアント側で実装）

## 通知の確認方法

### 講師側

1. アプリにログイン
2. 通知アイコンをタップ（今後実装予定）
3. 通知一覧ページで確認

現在は `/instructor/notifications` ページ（実装予定）または `/student/notifications` ページで確認できます。

## データ構造

### Firestore の `notifications` コレクション

```typescript
{
  userId: string,         // 通知を受け取るユーザーID
  title: string,          // 通知タイトル
  message: string,        // 通知メッセージ
  type: string,           // 'booking' | 'cancellation' | 'reminder' | 'system'
  bookingId?: string,     // 関連する予約ID（任意）
  isRead: boolean,        // 既読フラグ
  createdAt: Timestamp,   // 作成日時
  updatedAt: Timestamp    // 更新日時
}
```

## 実装ファイル

### 通知作成

- `lib/firebase/notifications.ts` - 通知のCRUD操作
- `lib/firebase/bookings.ts` - 予約作成・キャンセル時の通知作成

### 通知表示（実装予定）

- `app/instructor/notifications/page.tsx` - 講師の通知一覧
- `app/student/notifications/page.tsx` - 生徒の通知一覧

## 実装例

### 予約作成時の通知作成

```typescript
import { createNotification } from '@/lib/firebase/notifications';

// 予約作成後
await createNotification(
  instructorId,
  '📅 新しい予約があります',
  `${startTimeStr}に予約が入りました。生徒名: ${purpose}`,
  'booking',
  bookingId
);
```

### 予約キャンセル時の通知作成

```typescript
await createNotification(
  instructorId,
  '❌ 予約がキャンセルされました',
  `${startTimeStr}の予約がキャンセルされました`,
  'cancellation',
  bookingId
);
```

## 今後の展開

### 短期的な改善

1. 通知一覧ページの実装
2. 通知アイコンにバッジ表示（未読数）
3. 通知の既読/未読管理

### 中期的な改善

1. プッシュ通知（Web Notifications API）
2. メール通知（SendGrid など無料プラン）
3. LINE通知（LINE Messaging API フリープラン）

### 長期的な改善

1. スマート通知（重要度による分類）
2. 通知のカスタマイズ設定
3. 通知のバッチ処理

## コスト

- **Firestore**: 無料（Spark プラン）
  - 読み取り: 50,000回/日
  - 書き込み: 20,000回/日
  - 削除: 20,000回/日
- **実装**: 実質的に無料

**予約が月100件の場合**:
- 通知作成: 200回/月（予約 × 2）
- 通知読み取り: 3,000回/月（講師が30回/日 × 100日）
- **合計**: 約 3,200回/月（無料枠内）

## トラブルシューティング

### 通知が表示されない

1. Firestore の `notifications` コレクションに通知が作成されているか確認
2. `userId` が正しく設定されているか確認
3. ブラウザのコンソールでエラーを確認

### 通知が重複する

- 通知作成時の重複チェックを追加（実装予定）

## 比較: Slack通知 vs Firestore通知

| 項目 | Slack通知 | Firestore通知 |
|------|-----------|---------------|
| コスト | 有料（Blaze プラン必要） | **無料** |
| 設定の複雑さ | 高（Bot設定必要） | 低（設定不要） |
| 外部連携 | 必要 | 不要 |
| リアルタイム性 | 高い | 中程度 |
| 受信方法 | Slack DM | アプリ内 |
| 実装の難易度 | 高 | 低 |

## まとめ

- ✅ **完全無料**で動作
- ✅ 設定が簡単
- ✅ Firestore Spark プランで利用可能
- ✅ 実装が簡単
- ⚠️ アプリ内でのみ確認可能
- ⚠️ リアルタイム性は中程度
