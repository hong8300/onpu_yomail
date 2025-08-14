# Onpu - 開発者ガイド

## 🚀 クイックスタート

### 前提条件
- **Node.js** 20+ 
- **npm** 8+
- **Chrome/Edge/Opera** (MIDI機能使用時)

### セットアップ
```bash
# 1. リポジトリクローン
git clone https://github.com/your-username/onpu.git
cd onpu

# 2. アプリディレクトリに移動  
cd onpu-next

# 3. 依存関係インストール
npm install

# 4. 開発サーバー起動
npm run dev

# 5. ブラウザでアクセス
# http://localhost:3000
```

## 📋 開発コマンド

### 基本コマンド
```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# ESLint実行
npm run lint

# TypeScript型チェック（実装されている場合）
npm run typecheck
```

### 🚨 必須テストプロセス
**コードを変更したら必ず以下を実行してください：**

```bash
# 1. 開発サーバー起動
npm run dev

# 2. ブラウザアクセス確認
curl http://localhost:3000
# または ブラウザで http://localhost:3000 にアクセス

# 3. コード品質チェック
npm run lint

# 4. ビルドテスト
npm run build
```

## 🏗️ アーキテクチャ解説

### ディレクトリ構造詳細
```
onpu-next/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # ルートレイアウト（プロバイダー設定）
│   ├── page.tsx                 # ホームページ
│   ├── practice/page.tsx        # メイン練習画面
│   ├── settings/page.tsx        # 設定画面
│   └── history/page.tsx         # 履歴画面
├── components/                   # React コンポーネント
│   ├── music/                   # 楽譜・音楽関連
│   │   ├── VexflowMultipleNotes.tsx  # 双譜表楽譜表示
│   │   └── PianoKeyboard.tsx          # マルチオクターブ鍵盤
│   ├── midi/                    # MIDI統合
│   │   └── MidiConnection.tsx   # MIDI接続管理
│   ├── providers/               # Context プロバイダー
│   │   ├── MidiProvider.tsx     # MIDI状態管理
│   │   └── ThemeProvider.tsx    # ダークモード管理
│   └── ui/                      # Shadcn UI コンポーネント
├── hooks/                       # カスタムフック
│   ├── useMidi.ts              # MIDI統合フック
│   ├── useSettings.ts          # 設定管理フック
│   └── useHistory.ts           # 履歴管理フック
├── lib/                        # ユーティリティ・型定義
│   ├── types.ts               # TypeScript型定義
│   ├── settings.ts            # 設定データ定義
│   └── music-data.ts          # 音楽データ定義
└── public/                     # 静的ファイル
```

## 🔧 主要機能の実装詳細

### 1. 楽譜表示システム (VexflowMultipleNotes)
```typescript
// 必須: 動的インポート（SSR回避）
const VexflowMultipleNotes = dynamic(
  () => import('@/components/music/VexflowMultipleNotes'),
  { ssr: false }
);

// 双譜表レンダリングのコアロジック
// - StaveConnector使用でト音記号・ヘ音記号を連結
// - 音符配置の自動計算
// - レスポンシブ対応
```

**重要ポイント**:
- Vexflowは必ず動的インポートを使用
- SSR（サーバーサイドレンダリング）を無効化
- ダークモード時も楽譜エリアは白背景維持

### 2. MIDI統合システム (useMidi.ts)
```typescript
// SessionStorage + グローバル変数による永続化
const midiGlobalState = {
  connectedInputs: new Map(),
  isConnected: false
};

// ページ間での接続状態共有
// 自動再接続機能
// デバイスリスナーの適切な管理
```

**重要ポイント**:
- SessionStorageとグローバル変数の両方を更新
- ページナビゲーション時の自動復旧
- Web MIDI API対応ブラウザでのみ動作

### 3. マルチオクターブ鍵盤 (PianoKeyboard.tsx)
```typescript
// 音域設定に応じた動的オクターブ表示
const octaveCount = maxOctave - minOctave + 1;
const containerWidth = octaveCount * 336; // 336px per octave

// オクターブラベル表示（C3、D4等）
// シャープ・フラット制御
// 正解・不正解時の視覚フィードバック
```

**重要ポイント**:
- 元の鍵盤サイズ維持（w-12/w-8）
- 水平方向に拡張
- オクターブ情報の正確な表示

## 📊 状態管理パターン

### Context API使用パターン
```typescript
// MidiProvider: MIDI接続状態の管理
const MidiContext = createContext<MidiContextType | undefined>(undefined);

// ThemeProvider: ダークモードテーマ管理
// next-themesライブラリ使用

// 設定データ: LocalStorage直接操作
// 履歴データ: LocalStorage直接操作
```

### データ永続化戦略
```typescript
// 1. セッション中: React State（メモリ）
// 2. 設定データ: LocalStorage（永続化）
// 3. MIDI状態: SessionStorage（セッション持続）
// 4. 履歴データ: LocalStorage（永続化）
// 5. エクスポート: JSONファイル（ポータビリティ）
```

## 🎨 UI/UXパターン

### Shadcn UI使用パターン
```typescript
// 基本コンポーネント
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// カスタムコンポーネントでの拡張
// Tailwind CSSクラスでのスタイル調整
// ダークモード対応クラス使用
```

### レスポンシブ対応
```typescript
// Tailwind CSSブレークポイント
sm: '640px'   // モバイル
md: '768px'   // タブレット  
lg: '1024px'  // デスクトップ
xl: '1280px'  // 大画面

// 楽譜サイズの動的調整
const updateDimensions = () => {
  if (width < 640) {
    setVexflowDimensions({ width: width - 40, height: 180 });
  } else if (width < 768) {
    setVexflowDimensions({ width: width - 80, height: 200 });
  }
  // ...
};
```

## 🐛 デバッグガイド

### よくある問題と解決方法

#### 1. MIDI接続が認識されない
```bash
# 確認手順
1. Chrome/Edge/Operaを使用しているか？
2. MIDIデバイスが物理的に接続されているか？
3. ブラウザでMIDIアクセスを許可したか？
4. SessionStorageに接続情報があるか？

# デバッグ方法
- DevTools > Application > Session Storage > localhost確認
- DevTools > Console > MIDI関連ログ確認
```

#### 2. 楽譜が表示されない
```bash
# 確認手順
1. VexflowMultipleNotesが動的インポートされているか？
2. SSRが無効化されているか（ssr: false）？
3. コンソールにVexflowエラーがないか？

# デバッグ方法
- DevTools > Console > Vexflow関連エラー確認
- Network Tab > 静的ファイル読み込み確認
```

#### 3. 設定が保存されない
```bash
# 確認手順
1. LocalStorageが有効になっているか？
2. プライベートモードを使用していないか？
3. ブラウザの容量制限に達していないか？

# デバッグ方法
- DevTools > Application > Local Storage > localhost確認
- ストレージ使用量確認
```

#### 4. Internal Server Error対応
```bash
# 必須チェック項目
1. npm run devの起動ログ確認
2. ブラウザでhttp://localhost:3000アクセス
3. DevTools > Network > ステータスコード確認
4. DevTools > Console > エラーメッセージ確認

# エラー対応手順
1. サーバーログとブラウザログの両方確認
2. スタックトレースから原因特定
3. 段階的に機能を無効化して範囲特定
4. 修正後、必ず動作確認
```

## 📝 コーディング規約

### TypeScript
```typescript
// 厳密な型定義必須
interface PianoKeyboardProps {
  onNoteClick: (noteName: NoteName, octave?: number) => void;
  disabled?: boolean;
  // ...
}

// 共通型はlib/types.tsで定義
// コンポーネントPropsには適切な型注釈
```

### React パターン
```typescript
// 関数型コンポーネント使用
export function PianoKeyboard({ prop1, prop2 }: Props) {
  // カスタムフックでロジック分離
  const { settings } = useSettings();
  
  // useCallback/useMemoで最適化
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);
  
  return (
    // JSX
  );
}
```

### ファイル命名規約
```bash
# コンポーネント: PascalCase.tsx
PianoKeyboard.tsx
VexflowMultipleNotes.tsx

# フック: camelCase.ts  
useMidi.ts
useSettings.ts

# ユーティリティ: kebab-case.ts
music-data.ts
types.ts
```

## 🔒 品質保証

### 必須チェックリスト
**プルリクエスト前に必ず確認：**

- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` で成功
- [ ] `npm run dev` で起動確認
- [ ] ブラウザで主要機能動作確認
- [ ] Console にエラーなし
- [ ] MIDI機能テスト（対応ブラウザで）
- [ ] ダークモード切り替えテスト
- [ ] レスポンシブ表示確認（モバイル/タブレット）

### テスト環境
```bash
# 対応ブラウザでの動作確認
Chrome (推奨) - MIDI対応
Edge - MIDI対応
Opera - MIDI対応

# 非対応ブラウザでの基本機能確認
Firefox - MIDI非対応だが他機能は動作
Safari - MIDI非対応だが他機能は動作
```

## 🚀 デプロイメント

### Vercel デプロイ
```bash
# 1. GitHubリポジトリ作成・プッシュ
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/onpu.git
git push -u origin main

# 2. Vercel連携
# https://vercel.com でGitHub連携
# onpu-nextディレクトリをRoot Directoryに指定

# 3. 環境変数（現在は不要）
# 将来的にSupabase等使用時に設定
```

### セルフホスト
```bash
# 1. 本番ビルド
npm run build

# 2. PM2での本番起動（推奨）
npm install -g pm2
pm2 start npm --name "onpu" -- start

# 3. Nginx設定（リバースプロキシ）
# /etc/nginx/sites-available/onpu
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📚 追加リソース

### 技術ドキュメント
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vexflow API](https://github.com/0xfe/vexflow)
- [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [Shadcn UI](https://ui.shadcn.com/)

### 開発ツール
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

**最終更新**: 2025年8月14日  
**メンテナー**: Onpu Development Team