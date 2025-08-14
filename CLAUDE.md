# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**Status**: ✅ 実装完了 - メイン機能は動作中、継続的な機能追加フェーズ

## Project Overview

**Onpu - 楽譜学習アプリ** は、音符を見て瞬時に音名を答える練習ができるWebアプリケーション。
楽譜読解力の向上を目的とし、ド（C）から数えることなく音符を瞬時に認識する能力を鍛えます。

### 主な特徴
- 日本語・英語対応の音名表示（ド/C、レ/D等）
- MIDI キーボード統合
- Vexflow による美しい楽譜表示
- レスポンシブ対応
- ダークモード対応

## Technology Stack

- **Frontend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Music Notation**: Vexflow
- **MIDI Integration**: Web MIDI API
- **Audio**: Web Audio API
- **State Management**: React Context + LocalStorage + SessionStorage

## Development Commands

```bash
# Build
npm run build

# Test
npm run lint        # ESLintでコード品質チェック
npm run typecheck   # TypeScriptの型チェック（該当する場合）

# Lint
npm run lint

# Run/Start
npm start           # 本番モード
npm run dev         # 開発モード

# Development mode
npm run dev
```

## Architecture

### アプリケーション構造
- **Next.js App Router**: ファイルベースルーティング
- **React Context Patterns**: グローバル状態管理（テーマ、MIDI状態）
- **Hook-based Architecture**: カスタムフックによる状態管理とロジック分離
- **Component Composition**: 再利用可能なUI コンポーネント

### Key Directories

```
onpu-next/
├── app/                    # Next.js App Router（ページ定義）
│   ├── layout.tsx         # ルートレイアウト（プロバイダー設定）
│   ├── page.tsx           # ホームページ
│   ├── practice/          # 練習画面
│   ├── settings/          # 設定画面  
│   └── history/           # 履歴画面
├── components/            # React コンポーネント
│   ├── music/             # 楽譜・音楽関連コンポーネント
│   ├── midi/              # MIDI デバイス関連
│   ├── providers/         # React Context プロバイダー
│   └── ui/                # Shadcn UI ベースコンポーネント
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ・型定義
└── public/                # 静的アセット
```

### Entry Points

1. **`app/layout.tsx`**: アプリケーションルートレイアウト
   - ThemeProvider（ダークモード）
   - MidiProvider（MIDI状態管理）
   - フォント設定

2. **`app/page.tsx`**: ランディングページ
   - アプリケーション紹介
   - 主要機能へのナビゲーション

3. **`app/practice/page.tsx`**: メイン練習画面
   - 楽譜表示
   - 回答入力（MIDI/キーボード/マウス）
   - セッション管理

## Getting Started

このリポジトリで作業する際：

1. **技術スタック確認**: Next.js 15 + React 18 + TypeScript
2. **README.md参照**: 詳細な機能説明とセットアップ手順
3. **既存パターン確認**: 
   - カスタムフック使用パターン
   - Shadcn UI コンポーネント利用
   - TypeScript 型定義
4. **重要な依存関係**:
   - Vexflow: 動的インポート必須（SSR回避）
   - Web MIDI API: Chrome系ブラウザでのみ動作

## Code Standards

### TypeScript
- 厳密な型定義を使用
- `lib/types.ts` で共通型を定義
- コンポーネントpropsには適切な型注釈

### React Patterns
- 関数型コンポーネント使用
- カスタムフックでロジック分離
- `useCallback`、`useMemo` で最適化
- エラーバウンダリーの適切な配置

### State Management
- **LocalStorage**: 設定データの永続化
- **SessionStorage**: MIDI接続状態の永続化
- **React Context**: グローバル状態（テーマ、MIDI）
- **useState/useReducer**: ローカルコンポーネント状態

### Styling
- Tailwind CSS クラスベース
- Shadcn UI コンポーネント優先使用
- ダークモード対応必須
- レスポンシブデザイン考慮

## Critical Implementation Notes

### MIDI Integration
- **接続状態永続化**: SessionStorage + グローバル変数による実装
- **ページ間共有**: MidiProvider によるContext管理
- **自動再接続**: ページナビゲーション時の自動復旧
- **実装場所**: `/hooks/useMidi.ts`

### 楽譜表示
- **Vexflow**: 動的インポート必須 `dynamic(() => import())`
- **SSR回避**: `{ ssr: false }` オプション
- **ダークモード**: 楽譜エリアのみ白背景維持

### 音声機能
- **Web Audio API**: ブラウザ互換性確認必要
- **音符再生**: 各音名に対応した周波数設定
- **エラーハンドリング**: 音声機能が利用できない環境への対応

## Recent Major Changes

### 2025年8月: 楽譜表示・鍵盤機能の大幅強化
**機能**: 双譜表表示とマルチオクターブ鍵盤の実装

**実装内容**:
1. **双譜表楽譜表示**: ト音記号とヘ音記号を同時に表示
2. **音域プリセット刷新**: C4-C5（初心者）、C3-C6（中級）に簡素化
3. **マルチオクターブ鍵盤**: 設定に応じて1-4オクターブの鍵盤表示
4. **オクターブ判定機能**: 正確なオクターブでの回答を要求（D4≠D3）
5. **オクターブラベル表示**: 各鍵盤にオクターブ番号を表示（C3、D4等）

**影響ファイル**:
- `/components/music/VexflowMultipleNotes.tsx` - 双譜表対応に全面改修
- `/components/music/PianoKeyboard.tsx` - マルチオクターブ対応に全面改修
- `/lib/settings.ts` - 音域プリセット簡素化
- `/app/practice/page.tsx` - オクターブ判定ロジック追加

**技術的特徴**:
- VexflowのStaveConnectorを使用したブレース・縦線接続
- 動的オクターブ表示による柔軟な鍵盤レイアウト
- 元の鍵盤サイズを維持したままの横方向拡張
- オクターブを含む厳密な音符判定システム

### 2025年1月: MIDI接続状態永続化問題の解決
**問題**: 設定画面でMIDI接続後、練習画面では未接続と表示される

**解決策**:
1. SessionStorage による接続状態保存
2. グローバル変数による即座の状態共有  
3. ページロード時の自動MIDI再接続
4. デバイスリスナーの適切な復旧

**影響ファイル**: 
- `/hooks/useMidi.ts` (主要実装)
- `/components/providers/MidiProvider.tsx`
- `/components/midi/MidiConnection.tsx`

## Notes for Claude Code

### 開発時の重要事項
- **MIDI状態管理**: SessionStorage と グローバル変数の両方を更新する
- **Vexflow使用時**: 必ず動的インポートを使用する
- **ダークモード**: 楽譜エリア（white background）は例外扱い
- **テスト前**: `npm run lint` と `npm run build` を実行する

### デバッグのヒント
- MIDI問題: ブラウザのDevToolsでSessionStorageとConsoleログを確認
- 楽譜表示問題: Vexflowのエラーはコンソールで確認
- 状態管理問題: React DevToolsでContext状態を確認

### コード品質保持
- 既存のTypeScript型定義に従う
- Shadcn UIコンポーネントを優先的に使用
- アクセシビリティを考慮した実装
- パフォーマンスを考慮した状態管理

### 継続開発のために
- 新機能追加時はREADME.mdも更新
- 重要なアーキテクチャ変更時はこのCLAUDE.mdを更新
- ユーザーフィードバックに基づく優先度設定

## 【必須開発ルール・テスト要件】

### 必須確認事項
コードを実装する際は、以下を必ず守ること：

#### 1. 実装前チェック
- 依存関係（import/require）が正しいか確認
- 環境変数が適切に設定されているか確認
- ファイルパスが存在するか確認

#### 2. 実装中の確認
各関数・モジュールを実装するたびに：
- 構文エラーがないか確認
- 未定義の変数を使用していないか確認
- async/awaitの適切な使用を確認

#### 3. 実装後の必須テスト
- `npm run dev`を実行して起動確認
- ブラウザでアクセスして500エラーが出ないか確認
- コンソールログでエラーメッセージを確認
- 最低限、トップページが正常に表示されることを確認

#### 4. エラー時の対応
Internal Server Errorが発生した場合は、必ず：
- エラーログを確認
- スタックトレースを分析
- 修正後、再度`npm run dev`で動作確認

**「実装完了」と報告する前に、必ず上記のテストを実行し、Internal Server Errorが発生しないことを確認すること。**

### 開発ルール
1. 新しい機能を追加する前に、現在のアプリケーションが正常に動作することを確認
2. コードを変更したら、その都度`npm run dev`で動作確認
3. 「できました」と言う前に、必ず以下を実行：
   - サーバーを起動（`npm run dev`）
   - `localhost:[ポート番号]`にアクセス
   - 500エラーが表示されないことを確認
   - ネットワークタブでAPIリクエストが正常に処理されることを確認

**重要**: もしInternal Server Errorが1度でも発生したら、それを解決するまで「完成」とは言わない。

### コミュニケーション
- ユーザーに対する返答や報告は途中で英語にしない
- 必ず日本語で説明すること