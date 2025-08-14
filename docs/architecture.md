# Onpu - アーキテクチャ設計書

## 技術スタック

### フロントエンド
- **React 18+** - UIライブラリ
- **Next.js 15** - App Router使用
- **TypeScript** - 型安全性の確保
- **Tailwind CSS** - スタイリング
- **Shadcn/ui** - UIコンポーネントライブラリ

### データ管理
- **ローカルストレージ** - ブラウザ内でのセッションデータ保持
- **JSONファイル** - 学習履歴のエクスポート/インポート機能
- **Zustand or Context API** - 状態管理

### 開発ツール
- **ESLint** - Next.js設定でのコード品質管理
- **Prettier** - コードフォーマット

## ディレクトリ構造

```
onpu/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # ルートレイアウト（ダークモード対応）
│   ├── page.tsx             # ホームページ
│   ├── practice/            
│   │   └── page.tsx         # 練習画面
│   ├── history/             
│   │   └── page.tsx         # 履歴画面
│   └── api/                 
│       └── data/            # データ管理API
├── components/              
│   ├── ui/                  # Shadcn UIコンポーネント
│   ├── music/               
│   │   ├── Staff.tsx        # 五線譜コンポーネント
│   │   ├── Note.tsx         # 音符コンポーネント
│   │   └── NoteButton.tsx   # 回答ボタン
│   ├── practice/            
│   │   ├── SessionConfig.tsx    # セッション設定
│   │   ├── ProgressBar.tsx      # 進捗表示
│   │   └── ResultDisplay.tsx    # 結果表示
│   └── layout/             
│       ├── Header.tsx       # ヘッダー
│       └── ThemeToggle.tsx  # テーマ切り替え
├── lib/                     
│   ├── types.ts            # TypeScript型定義
│   ├── constants.ts        # 定数定義
│   ├── music-data.ts       # 音符データ定義
│   ├── utils.ts            # ユーティリティ関数
│   └── storage.ts          # ストレージ管理
├── hooks/                   
│   ├── useSession.ts       # セッション管理
│   ├── useHistory.ts       # 履歴管理
│   └── useSound.ts         # 音響管理（将来用）
├── public/                  
│   ├── images/             
│   │   ├── staff/          # 五線譜画像
│   │   └── notes/          # 音符画像
│   └── data/               # ユーザーデータ（.gitignore対象）
└── styles/                  
    └── globals.css         # グローバルスタイル

```

## データモデル

### Session（練習セッション）
```typescript
interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  settings: SessionSettings;
  questions: Question[];
  results: SessionResult;
}

interface SessionSettings {
  totalQuestions: number;  // 10-100
  noteRange: NoteRange;    // 音域設定
  difficulty: 'easy' | 'medium' | 'hard';
  clef: 'treble' | 'bass' | 'both';
}

interface Question {
  id: string;
  note: Note;
  userAnswer?: string;
  isCorrect?: boolean;
  responseTime?: number;
  timestamp: Date;
}

interface Note {
  name: string;        // 'C', 'D', 'E', etc.
  octave: number;      // 1-5
  clef: 'treble' | 'bass';
  position: {          // 楽譜上の位置
    line?: number;     // 線上
    space?: number;    // 間
    ledgerLines?: number; // 加線数
  };
}
```

### History（学習履歴）
```typescript
interface UserHistory {
  sessions: Session[];
  statistics: Statistics;
  lastUpdated: Date;
}

interface Statistics {
  totalSessions: number;
  totalQuestions: number;
  averageAccuracy: number;
  problemNotes: NoteStatistic[];  // 苦手な音符
  slowNotes: NoteStatistic[];     // 時間がかかる音符
}

interface NoteStatistic {
  note: Note;
  errorRate: number;
  averageResponseTime: number;
  totalAttempts: number;
}
```

## 主要機能の実装方針

### 1. 楽譜表示
- 五線譜: SVG or 高解像度PNG背景画像
- 音符配置: CSS position:absolute で座標指定
- レスポンシブ: CSS Grid/Flexbox + transform: scale()

### 2. データ永続化戦略
```
1. セッション中: Zustand/Context APIでメモリ管理
2. セッション終了: LocalStorageに保存
3. エクスポート: JSONファイルとしてダウンロード
4. インポート: JSONファイルをアップロード
5. 自動バックアップ: public/data/に定期保存（開発時のみ）
```

### 3. マシン間でのデータ移行
```
方法1: JSONエクスポート/インポート
- エクスポートボタン → history.json ダウンロード
- 別マシンでインポートボタン → ファイル選択 → データ復元

方法2: データディレクトリ同期（開発者向け）
- public/data/ フォルダをコピー
- .gitignoreでGit管理から除外
- 手動でフォルダコピーして移行
```

### 4. ダークモード実装
- next-themesライブラリ使用
- Tailwind CSSのdark:クラス活用
- システム設定連動オプション

## API設計

### `/api/data/export`
- GET: 履歴データをJSON形式で取得

### `/api/data/import`
- POST: JSONデータをインポート

### `/api/data/backup`
- POST: ローカルファイルシステムにバックアップ（開発環境のみ）

## パフォーマンス最適化

1. **画像の事前読み込み**
   - 音符画像をpreloadで先読み
   - 五線譜画像の最適化（WebP形式検討）

2. **レンダリング最適化**
   - React.memoで不要な再レンダリング防止
   - 音符切り替えアニメーションの最適化

3. **データ管理**
   - 履歴データの定期的な圧縮
   - 古いセッションデータのアーカイブ機能

## セキュリティ考慮事項

- ローカル実行のためセキュリティリスクは低い
- データエクスポート時の個人情報含有なし
- CORS設定は開発環境のみ緩和

## 今後の拡張性

1. **MIDI対応準備**
   - Web MIDI APIのインターフェース設計
   - 入力抽象化レイヤーの実装

2. **Supabase移行準備**
   - データモデルをSupabase互換に設計
   - 認証機能の追加余地を確保

3. **モバイルアプリ化**
   - React Native / Capacitorへの移行考慮
   - タッチ操作最適化の準備