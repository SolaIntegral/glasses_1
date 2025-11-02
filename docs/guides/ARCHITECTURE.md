# システムアーキテクチャ設計書

## 1. システム全体図

```mermaid
graph TB
    subgraph "クライアント層"
        A[Webブラウザ]
        B[生徒用UI]
        C[講師用UI]
    end
    
    subgraph "アプリケーション層"
        D[Next.js Frontend]
        E[React Components]
        F[State Management]
    end
    
    subgraph "Firebase層"
        G[Firebase Authentication]
        H[Firestore Database]
        I[Cloud Functions]
        J[Firebase Storage]
        K[Firebase Hosting]
    end
    
    subgraph "外部連携"
        L[Slack API]
        M[SendGrid/Email Service]
    end
    
    A --> D
    D --> E
    D --> F
    E --> G
    E --> H
    E --> J
    H --> I
    I --> L
    I --> M
    K --> D
    
    style A fill:#e1f5ff
    style D fill:#fff4e1
    style G fill:#ffe1e1
    style H fill:#ffe1e1
    style I fill:#ffe1e1
    style L fill:#e1ffe1
    style M fill:#e1ffe1
```

---

## 2. データベース ER図

```mermaid
erDiagram
    USERS ||--o{ INSTRUCTORS : "is"
    USERS ||--o{ BOOKINGS : "creates"
    INSTRUCTORS ||--o{ AVAILABLE_SLOTS : "has"
    INSTRUCTORS ||--o{ BOOKINGS : "receives"
    AVAILABLE_SLOTS ||--o| BOOKINGS : "reserved_by"

    USERS {
        string uid PK
        string email
        string displayName
        string role
        timestamp createdAt
        timestamp updatedAt
    }
    
    INSTRUCTORS {
        string id PK
        string userId FK
        string profileImageUrl
        string bio
        array specialties
        string slackWebhookUrl
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }
    
    AVAILABLE_SLOTS {
        string id PK
        string instructorId FK
        timestamp startTime
        timestamp endTime
        boolean isBooked
        timestamp createdAt
    }
    
    BOOKINGS {
        string id PK
        string instructorId FK
        string studentId FK
        string slotId FK
        timestamp startTime
        timestamp endTime
        string purpose
        string notes
        string status
        timestamp createdAt
        timestamp updatedAt
        timestamp cancelledAt
        string cancelReason
    }
```

---

## 3. 認証フロー図

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as Frontend
    participant A as Firebase Auth
    participant D as Firestore
    
    U->>F: ログイン情報入力
    F->>A: signInWithEmailAndPassword()
    A->>A: 認証処理
    alt 認証成功
        A->>F: User Token
        F->>D: ユーザー情報取得
        D->>F: User Data + Role
        F->>U: ロールに応じた画面表示
    else 認証失敗
        A->>F: Error
        F->>U: エラーメッセージ表示
    end
```

---

## 4. 予約処理フロー図

```mermaid
sequenceDiagram
    participant S as 生徒
    participant F as Frontend
    participant D as Firestore
    participant CF as Cloud Functions
    participant SL as Slack
    participant E as Email Service
    
    S->>F: 講師選択
    F->>D: 空き時間取得
    D->>F: 空き時間リスト
    F->>S: カレンダー表示
    
    S->>F: 時間選択 + 予約情報入力
    F->>D: 予約リクエスト（Transaction）
    
    D->>D: 空き時間の予約状態チェック
    alt 空きあり
        D->>D: 予約作成 + スロット更新
        D->>CF: onCreate Trigger
        D->>F: 予約完了
        F->>S: 予約完了画面
        
        CF->>D: 講師・生徒情報取得
        par 並行処理
            CF->>SL: Slack通知送信
            CF->>E: メール送信
        end
    else 既に予約済み
        D->>F: Error: Already Booked
        F->>S: エラーメッセージ
    end
```

---

## 5. キャンセル処理フロー図

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as Frontend
    participant D as Firestore
    participant CF as Cloud Functions
    participant SL as Slack
    participant E as Email Service
    
    U->>F: キャンセルボタンクリック
    F->>F: 24時間前チェック
    
    alt 24時間以上前
        F->>U: キャンセル確認モーダル
        U->>F: キャンセル確定
        
        F->>D: キャンセルリクエスト（Transaction）
        D->>D: 予約ステータス更新
        D->>D: 空き時間復元
        D->>CF: onUpdate Trigger
        D->>F: キャンセル完了
        
        CF->>D: 講師・生徒情報取得
        par 並行処理
            CF->>SL: キャンセル通知
            CF->>E: キャンセルメール送信
        end
        
        F->>U: キャンセル完了メッセージ
    else 24時間未満
        F->>U: キャンセル不可メッセージ
    end
```

---

## 6. 画面遷移図

```mermaid
graph LR
    A[トップページ] --> B{認証状態}
    B -->|未ログイン| C[ログイン画面]
    B -->|未ログイン| D[新規登録画面]
    B -->|ログイン済| E{ロール判定}
    
    C --> E
    D --> E
    
    E -->|生徒| F[講師一覧]
    E -->|講師| G[講師ダッシュボード]
    
    F --> H[講師詳細・予約]
    H --> I[予約確認]
    I --> J[予約完了]
    
    F --> K[マイ予約一覧]
    K --> L[予約詳細]
    L --> M[キャンセル確認]
    M --> N[キャンセル完了]
    
    G --> O[空き時間管理]
    G --> P[予約一覧]
    G --> Q[プロフィール編集]
    
    O --> R[空き時間追加]
    P --> S[予約詳細]
    
    style A fill:#e1f5ff
    style F fill:#fff4e1
    style G fill:#ffe1f4
    style J fill:#e1ffe1
    style N fill:#ffe1e1
```

---

## 7. コンポーネント構成図

```mermaid
graph TB
    subgraph "Pages"
        A[App Layout]
        B[Home Page]
        C[Login Page]
        D[Register Page]
        E[Instructors Page]
        F[Instructor Detail Page]
        G[My Bookings Page]
        H[Instructor Dashboard]
        I[Availability Management]
        J[Instructor Bookings]
    end
    
    subgraph "Shared Components"
        K[Header]
        L[Footer]
        M[Navigation]
        N[Loading Spinner]
        O[Error Boundary]
    end
    
    subgraph "Feature Components"
        P[InstructorCard]
        Q[InstructorProfile]
        R[Calendar]
        S[TimeSlotPicker]
        T[BookingForm]
        U[BookingCard]
        V[CancelModal]
        W[AvailabilityForm]
    end
    
    subgraph "UI Components"
        X[Button]
        Y[Input]
        Z[Modal]
        AA[Card]
        AB[Badge]
    end
    
    A --> K
    A --> L
    A --> M
    A --> O
    
    B --> K
    E --> P
    F --> Q
    F --> R
    F --> S
    F --> T
    
    G --> U
    G --> V
    
    I --> R
    I --> W
    
    P --> AA
    U --> AA
    T --> Y
    T --> X
    V --> Z
    
    style A fill:#e1f5ff
    style K fill:#fff4e1
    style P fill:#ffe1f4
    style X fill:#e1ffe1
```

---

## 8. セキュリティアーキテクチャ

```mermaid
graph TB
    subgraph "Frontend Security"
        A[認証ガード]
        B[ロールベースアクセス制御]
        C[入力バリデーション]
        D[XSS対策]
    end
    
    subgraph "Firebase Security"
        E[Authentication]
        F[Firestore Rules]
        G[Storage Rules]
        H[Cloud Functions Auth]
    end
    
    subgraph "Data Protection"
        I[環境変数暗号化]
        J[Slack Webhook暗号化]
        K[個人情報保護]
    end
    
    A --> E
    B --> F
    C --> H
    D --> K
    E --> F
    F --> G
    
    style A fill:#ffe1e1
    style E fill:#ffe1e1
    style I fill:#ffe1e1
```

---

## 9. ローカル開発環境アーキテクチャ

```mermaid
graph TB
    subgraph "開発マシン"
        A[Next.js Dev Server<br/>localhost:3000]
        B[Firebase Emulator Suite]
        C[Authentication Emulator<br/>localhost:9099]
        D[Firestore Emulator<br/>localhost:8080]
        E[Functions Emulator<br/>localhost:5001]
        F[Hosting Emulator<br/>localhost:5000]
    end
    
    subgraph "外部サービス（開発時）"
        G[Slack Webhook<br/>テストチャンネル]
        H[SendGrid<br/>テストアカウント]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    E --> G
    E --> H
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style G fill:#e1ffe1
    style H fill:#e1ffe1
```

### ローカル開発の特徴：
1. **Firebase Emulator Suite**: 完全ローカルでFirebaseサービスを模擬
2. **データの永続化**: エミュレーターのデータをローカルに保存可能
3. **高速イテレーション**: 本番環境に影響を与えずに開発
4. **コスト削減**: ローカル実行のため課金なし

---

## 10. デプロイアーキテクチャ（本番環境）

```mermaid
graph TB
    subgraph "ユーザー"
        A[Webブラウザ]
    end
    
    subgraph "CDN/Hosting"
        B[Firebase Hosting<br/>グローバルCDN]
    end
    
    subgraph "Firebase Production"
        C[Firebase Authentication]
        D[Firestore Database<br/>Multi-region]
        E[Cloud Functions<br/>サーバーレス]
        F[Cloud Storage<br/>メディアファイル]
    end
    
    subgraph "外部サービス"
        G[Slack API<br/>本番チャンネル]
        H[SendGrid<br/>本番アカウント]
    end
    
    subgraph "モニタリング"
        I[Firebase Analytics]
        J[Cloud Monitoring]
        K[Error Reporting]
    end
    
    A --> B
    B --> C
    B --> D
    A --> C
    A --> D
    D --> E
    E --> G
    E --> H
    E --> I
    E --> J
    E --> K
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style D fill:#ffe1e1
    style E fill:#ffe1e1
```

---

## 11. 技術スタック詳細

### フロントエンド
| 技術 | 用途 | 理由 |
|------|------|------|
| Next.js 14 | フレームワーク | SSR/SSG対応、高速、SEO最適化 |
| TypeScript | 型安全性 | バグ削減、開発効率向上 |
| Tailwind CSS | スタイリング | 高速開発、一貫性のあるデザイン |
| React Hook Form | フォーム管理 | パフォーマンス良好、使いやすい |
| Zod | バリデーション | 型安全なスキーマ定義 |
| react-big-calendar | カレンダー | 柔軟性が高い、カスタマイズ可能 |

### バックエンド
| 技術 | 用途 | 理由 |
|------|------|------|
| Firebase Auth | 認証 | セキュアで簡単、メール認証対応 |
| Firestore | データベース | リアルタイム同期、スケーラブル |
| Cloud Functions | サーバー処理 | サーバーレス、自動スケーリング |
| Cloud Storage | ファイル保存 | 画像アップロード用 |

### 開発ツール
| 技術 | 用途 | 理由 |
|------|------|------|
| Firebase Emulator | ローカル開発 | コスト削減、高速開発 |
| ESLint | コード品質 | 統一されたコーディングスタイル |
| Prettier | コード整形 | 自動フォーマット |
| Jest | テスト | 信頼性の高いテストフレームワーク |

---

## 12. パフォーマンス最適化戦略

### フロントエンド最適化
1. **コード分割**: 動的インポートでバンドルサイズ削減
2. **画像最適化**: Next.js Image コンポーネント使用
3. **キャッシング**: SWR または React Query でデータキャッシュ
4. **Lazy Loading**: 画面外コンポーネントの遅延読み込み

### バックエンド最適化
1. **インデックス作成**: Firestore クエリの最適化
2. **バッチ処理**: 複数のデータ操作を一括実行
3. **キャッシュ戦略**: Cloud Functions でメモリキャッシュ活用
4. **リージョン選択**: ユーザーに近いリージョンを選択

---

## 13. スケーラビリティ設計

### 現在の規模（Phase 1）
- 講師: 10名
- 想定生徒数: 100-500名
- 月間予約数: 200-1000件

### 将来の拡張性
1. **講師数増加**: 100名以上に対応可能
2. **生徒数増加**: 10,000名以上に対応可能
3. **リージョン拡大**: マルチリージョン対応
4. **機能追加**: グループMTG、ビデオ会議連携など

### Firebaseの自動スケーリング
- トラフィック増加に自動対応
- 追加の設定不要
- 従量課金で無駄なコストなし

---

## 14. 災害復旧・バックアップ戦略

### データバックアップ
1. **自動バックアップ**: Firestore 毎日バックアップ
2. **エクスポート機能**: 定期的にデータエクスポート
3. **バージョン管理**: コードのGit管理

### 障害対策
1. **マルチリージョン**: 複数リージョンでデータ複製
2. **エラーモニタリング**: リアルタイムエラー検知
3. **フォールバック**: エラー時の代替UI表示

---

## 15. 開発からデプロイまでのフロー

```mermaid
graph LR
    A[ローカル開発] --> B[Firebase Emulator]
    B --> C[テスト実行]
    C --> D{テスト結果}
    D -->|Pass| E[Gitコミット]
    D -->|Fail| A
    E --> F[GitHub Push]
    F --> G[CI/CD]
    G --> H[ステージング環境]
    H --> I[手動確認]
    I --> J{確認OK?}
    J -->|Yes| K[本番デプロイ]
    J -->|No| A
    K --> L[モニタリング]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style K fill:#e1ffe1
    style L fill:#ffe1e1
```

### 各段階の詳細
1. **ローカル開発**: Firebase Emulator で動作確認
2. **テスト**: ユニット・統合テスト実行
3. **ステージング**: テスト環境で最終確認
4. **本番デプロイ**: `firebase deploy` で一括デプロイ
5. **モニタリング**: Firebase Console でメトリクス確認

