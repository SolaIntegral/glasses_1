# 2025-11-10 Firebase Hosting でのクリーンURL対応

## 事象

- Firebase Hosting にデプロイ後、ブラウザを強制リロードすると以下の挙動が発生:
  - URL が `/admin/instructors/edit?uid=...` などのままでも、アプリのトップページ（`/`）が表示される。
  - そのままページ遷移を行うとログイン状態が不安定になり、意図しないログアウトが発生する。
  - `/admin/instructors/edit?...` を再読み込みすると Next.js の 404 ページが表示される。

## 原因

1. 以前の Hosting 設定に `"rewrites": [{"source": "**", "destination": "/index.html"}]` があったため、どのパスでも `index.html` が返されていた。
2. このリライトを削除した結果、拡張子なしの URL に対して Firebase が `admin/instructors/edit.html` を直接解決できず 404 になった。

## 対応

1. Hosting 設定に `"cleanUrls": true` を追加。
   ```json
   {
     "hosting": {
       "public": "out",
       "ignore": [...],
       "cleanUrls": true,
       "headers": [...]
     }
   }
   ```
   - 拡張子 `.html` を省略した URL も自動解決されるようになり、`/admin/...` などの静的ページが正しく表示される。
2. 変更後、`firebase deploy --only hosting` でデプロイし、ブラウザを強制リロードして動作確認済み。

## 再発防止メモ

- Next.js を `next export` で静的出力し Firebase Hosting へ配置する際、SPA 用の一括リライトが不要な場合は `"cleanUrls": true` を設定する。
- URL リライトを変更した際は、`/admin/...` など静的に出力される全ページで強制リロードを行い 404 が出ないことを確認する。

