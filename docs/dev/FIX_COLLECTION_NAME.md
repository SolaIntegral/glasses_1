# コレクション名の修正が必要です

## 問題

現在、Firestoreに `user` というコレクションがありますが、正しくは **`users`**（複数形）にする必要があります。

## 修正方法

### 方法1: 新しいコレクションを作成（推奨）

1. 左側のコレクション一覧で `user` をクリック
2. `admin001` ドキュメントを開く
3. すべてのフィールドと値をコピーしてメモ
4. 「+ コレクションを開始」をクリック
5. コレクションIDに **`users`** と入力
6. ドキュメントIDに **`admin001`** と入力
7. メモしたフィールドと値をすべて設定
8. 「保存」をクリック

### 方法2: ブラウザのコンソールから直接修正

1. Firestore Consoleにアクセス
2. ブラウザのコンソールを開く（F12キー）
3. 以下のコードを実行：

```javascript
// 現在のuserコレクションからデータを取得
const oldDoc = await firebase.firestore().collection('user').doc('admin001').get();
const oldData = oldDoc.data();

// usersコレクションに新しいドキュメントを作成
await firebase.firestore().collection('users').doc('admin001').set(oldData);

console.log('✅ usersコレクションにコピーしました');
```

## 確認

コレクション名が **`users`** になっていることを確認してください。

その後、https://glasses1-582eb.web.app/auth/login/ にアクセスして再ログインしてください。
