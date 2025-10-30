# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

React Rich Painterは、Reactで統合可能な本格的なペイント機能を提供するライブラリです。マウス入力、タッチ入力、ペン入力をサポートし、レイヤー機能、ブラシ機能、スポイト機能などを備えています。

- **Node**: 22以上
- **React**: 19
- **ビルドツール**: Vite
- **状態管理**: Zustand
- **スタイリング**: styled-components

## 開発用コマンド

```bash
# 開発サーバーの起動
npm run dev

# ビルド（型生成 → Vite ビルド → TypeScript型定義生成）
npm run build

# 型チェック
npm run typecheck

# 型定義のみ生成
npm run typegen

# Linting
npm run lint          # ESLintを実行（エラー時に停止）
npm run eslint        # ESLintを実行（自動修正）
npm run eslint:ci     # CI用のESLint実行

# Formatting
npm run prettier      # Prettierでフォーマットをチェック
npm run prettier-fix  # Prettierで自動フォーマット

# Storybook
npm run storybook        # Storybookの起動（ポート6006）
npm run build-storybook  # Storybookのビルド

# プレビュー
npm run preview
```

## アーキテクチャ

### コア構造

プロジェクトは以下の3つの主要レイヤーで構成されています：

#### 1. **Painter Engine（`src/lib/utils/painter/`）**
描画ロジックのコア実装：

- **`RichPainter.ts`**: メインのペインターエンジン
  - レイヤー管理（追加、削除、選択、入れ替え、不透明度、可視化）
  - Undo/Redo機能（スタックベース、デフォルト30回まで）
  - 描画処理（down/move/up）
  - スタビライザー統合（手ぶれ補正）
  - 指先ツール（Finger Tool）のぼかし処理
  - バケツツール（FloodFill）
  - スポイト機能（dripperColor）
  - サムネイル生成（レイヤー単位、統合）

- **`Brush.ts`**: ブラシツール実装
  - ブラシプロパティ（色、サイズ、スペーシング、フロー、角度、最小サイズ）
  - ツールタイプ（pen、eraser、dripper、rect、move）
  - カスタムブラシ画像のサポート
  - 色のマージ処理（ミキシング）
  - ラジアルグラデーション描画
  - 指先ツールモード

- **`Stabilizer.ts`**: 手ぶれ補正機能
  - パラメータテーブルによる座標の平滑化
  - レベルとウェイトによる調整可能な安定化
  - タイマーベースの遅延補正

- **`Tablet.ts`**: ペンタブレット/タッチデバイス入力処理

#### 2. **React Components（`src/lib/components/`）**

- **`Painter.tsx`**: メインコンポーネント
  - `ReactRichPainter`: エントリーポイント
    - `autoSize`プロパティ（デフォルト: true）: 親要素のサイズから自動的にキャンバスサイズを決定
    - `autoSize=true`の場合: ResizeObserverで親要素のサイズを監視し、0.8倍をキャンバスサイズとして設定
    - `autoSize=false`の場合: `width`と`height`プロパティで固定サイズを指定
  - `PaintCanvas`: キャンバス描画領域
  - ポインターイベント処理（pointerdown、pointermove、pointerup、pointercancel）
  - Pointer Capture実装（キャンバス外でのイベント捕捉）
  - キーボードショートカット（Ctrl+Z: Undo、Ctrl+Y: Redo）
  - スタビライザー設定（level: 5, weight: 0.5）

- **`PainterContext.tsx`**: Painter インスタンスのコンテキスト
  - `usePainter`: PainterとBrushにアクセスするカスタムフック
  - UIコンポーネント間でのPainterインスタンス共有

- **UI Components（`src/lib/components/ui/`）**:
  - `Toolbar.tsx`: ツールバー（レイヤー、ツール選択、設定）
  - `BrushBar.tsx`: ブラシ設定バー（サイズ、不透明度、カラーパレット）
  - `Wrapper.tsx` / `WrapperContext.tsx`: UIコンテナとコンテキスト
    - localStorage統合による位置の永続化（`wrapper-position-${draggableId}`キーで保存）
    - DndContextによるドラッグ&ドロップ機能

- **Panels（`src/lib/components/ui/panels/`）**:
  - `LayerPanel.tsx`: レイヤー管理パネル
    - 最大30レイヤーのサポート
    - レイヤーの追加、削除、選択機能
    - スクロール可能なレイヤーリスト（最大高さ400px）
    - 右側に配置（初期位置: window.innerWidth - 250）
    - WrapperContextによるドラッグ可能なパネル
    - レイヤー数カウンター表示
  - `LayerItem.tsx`: 個別レイヤーアイテム
    - サムネイル表示（40x40px、1秒ごとに更新）
    - レイヤー名の編集機能（クリックで編集モード、Enter/Escapeで完了/キャンセル）
    - 不透明度スライダー（0-100%）
    - 可視化トグル（目アイコン）
    - レイヤー順序変更ボタン（上下矢印）
    - 削除ボタン
    - 横幅比率: サムネイル(20%) : 情報(60%) : アクション(20%)

- **Toolbars（`src/lib/components/ui/toolbars/`）**:
  - `ToolButton.tsx`: ツールボタンの共通コンポーネント（DRY原則）
  - `BrushType.tsx`: ブラシ（ペン）ツール - 通常描画モード
  - `Eraser.tsx`: 消しゴムツール - knockout モード有効化
  - `Lasso.tsx`: 投げ縄選択ツール
  - `HandMove.tsx`: 手のひらツール - キャンバス移動
  - `PenType.tsx`: ペンタイプ選択（入力デバイス選択）
  - `Layer.tsx`: レイヤーパネル表示トグル
    - ツール選択とは独立したUI状態管理（`useUiStore`）
    - パネル開閉時に青色でハイライト表示
  - `Config.tsx`: 設定UI

- **Brush Bars（`src/lib/components/ui/brushbars/`）**:
  - `Sizer.tsx`: ブラシサイズ調整
  - `Opacity.tsx`: 不透明度調整
  - `ColorPallet.tsx`: カラーパレット
  - `VerticalSlider.tsx`: 垂直スライダーコンポーネント

#### 3. **State Management（`src/lib/components/store/`）**
Zustandによる状態管理：

- **`tool.ts`**: ツール状態（現在選択中のツール、ツール切り替え）
  - ToolType: `pen` | `eraser` | `dripper` | `rect` | `move` | `lasso`
  - `useToolStore`: ツール状態管理フック
- **`brush.ts`**: ブラシ状態（サイズ、色、形状）
- **`layer.ts`**: レイヤー名管理
  - `layerNames`: レイヤーインデックスと名前のマッピング
  - `getLayerName(index)`: レイヤー名の取得（デフォルト: `レイヤー ${index + 1}`）
  - `setLayerName(index, name)`: レイヤー名の設定
  - `addLayerName(index, name?)`: 新規レイヤー名の追加
  - `swapLayerNames(indexA, indexB)`: レイヤー入れ替え時の名前スワップ
  - `shiftLayerNamesAfterRemove(index)`: レイヤー削除後の名前シフト処理
- **`ui.ts`**: UI状態管理
  - `isLayerPanelOpen`: レイヤーパネルの開閉状態
  - `toggleLayerPanel()`: レイヤーパネルのトグル
  - ツール選択とは独立した状態管理
- **`canvas.ts`**: キャンバス状態
- **`selection.ts`**: 選択範囲状態
- **`utils.ts`**: ユーティリティ

#### 4. **Event Handlers（`src/lib/utils/canvas/`）**

- **`events.ts`**: キャンバスイベント処理
  - `canvasPointerDown`: ポインター押下時の処理
  - `canvasPointerMove`: ポインター移動時の処理
  - `canvasPointerUp`: ポインター離脱時の処理

- **`userUtilities.ts`**: ユーザー入力タイプ判定
  - デバイスタイプの検出（PC、タブレット、スマートフォン）
  - 入力タイプの判定（mouse、pen、touch、finger）

### 描画フロー

1. **ユーザー入力** → `Painter.tsx`のPointerEventリスナー
2. **イベント処理** → `canvasPointerDown/Move/Up`（`src/lib/utils/canvas/events.ts`）
3. **Painter Engine** → `RichPainter.down/move/up`（スタビライザー適用）
4. **ブラシ描画** → `Brush.down/move/up`（paintingCanvasへ描画）
5. **レイヤー統合** → `drawPaintingCanvas`で本番レイヤーに転写
6. **Undo/Redo** → `pushUndo`でスナップショット保存

### レイヤーシステム

- 各レイヤーは独立したHTMLCanvasElement
- DOMツリー上での順序で重なり順を制御
- `paintingCanvas`: 描画中の一時キャンバス
- `ghostLayer`: 指先ツール用の一時キャンバス
- レイヤーごとに不透明度と可視化を制御可能

### Undo/Redoシステム

- スタックベースの実装（`undoStack`、`redoStack`）
- DirtyRect最適化（変更領域のみをImageDataで保存）
- トランザクション機能（複数操作を1つのUndoに統合）
- History Lock機能（一時的にUndo記録を無効化）

## ビルド設定

### ライブラリとしてのビルド
`vite.config.ts`でライブラリモードを設定：
- エントリーポイント: `src/lib/index.tsx`
- 外部化: `react`、`react-dom`
- 出力: UMD形式（`dist/index.umd.cjs`）とESM形式（`dist/index.js`）

### 型定義
TypeScriptコンパイラで型定義を生成し、`types/index.d.ts`として出力。

## 開発時の注意点

### Painterインスタンス初期化
- **重要**: `Painter.tsx`でのPainterインスタンス初期化は空の依存配列`[]`を使用
  ```typescript
  useEffect(() => {
    const painter = new RichPainter({ undoLimit: 30, initSize: { width: 800, height: 600 } });
    setPainter(painter);
  }, []); // 空の依存配列で1回のみ初期化
  ```
- キャンバスサイズの変更は別のuseEffectで処理し、Painterインスタンスを再生成しない
  ```typescript
  useEffect(() => {
    if (painter && (painter.getCanvasSize().width !== canvasSize.width ||
                    painter.getCanvasSize().height !== canvasSize.height)) {
      painter.lockHistory();
      painter.setCanvasSize(canvasSize.width, canvasSize.height);
      painter.unlockHistory();
    }
  }, [painter, canvasSize.width, canvasSize.height]);
  ```
- これにより、ブラシ設定が保持され、不要な再初期化を防止

### Undo/Redoエラーハンドリング
- Undo/Redo操作は必ずtry-catchで囲む
  ```typescript
  try {
    painter.undo();
  } catch (error) {
    console.log('Undo not available:', error);
  }
  ```
- スタックが空の場合のエラーをユーザーに表示せず、コンソールログのみに記録

### Canvas操作
- `getContext("2d")`の結果は必ず存在確認してから使用
- `paintingCanvas`への描画は必ず`drawPaintingCanvas()`で本番レイヤーに転写
- レイヤー操作時は必ず`lockHistory()`/`unlockHistory()`でUndo記録を制御

### ブラシ実装
- ブラシのスペーシングは`delta`変数で制御（連続描画の間隔）
- `transformedImage`はキャッシュされ、`transformedImageIsDirty`フラグで再生成を管理
- カスタムブラシ画像は`HTMLImageElement`として設定

### イベント処理
- Pointer Eventsを使用（Touch EventsとMouse Eventsの統一）
- `touchAction: 'none'`でデフォルトのブラウザ動作を無効化
- 筆圧は`PointerEvent.pressure`から取得（0〜1の範囲）
- Pointer Capture実装により、キャンバス外でのポインタリリースも捕捉
- `canvasPointerMove`は描画中（`isDrawing === true`）のみ処理

### ツール切り替えアーキテクチャ
- **ToolButton共通コンポーネント**: DRY原則に従い、ツールボタンのロジックを共通化
  - ツール選択状態の管理
  - 視覚的フィードバック（選択中は青色でハイライト）
  - クリック時のツール切り替え処理
- **Zustand Store**: `useToolStore`でツール状態を集中管理
- **各ツールの役割**:
  - `pen`: 通常描画（knockout: false）
  - `eraser`: 消しゴム（knockout: true）
  - `lasso`、`rect`、`move`: 選択・移動ツール（今後実装予定）

### レイヤーパネル管理
- **UI状態の独立**: レイヤーパネルの開閉状態はツール選択とは独立して`useUiStore`で管理
- **レイヤー名の永続化**: `useLayerNameStore`でレイヤーインデックスと名前をマッピング
- **レイヤー順序変更時の選択保持**:
  ```typescript
  const currentSelected = painter.getCurrentLayerIndex();
  painter.swapLayer(index, index + 1);
  swapLayerNames(index, index + 1);

  // 選択中のレイヤーの新しいインデックスを計算
  let newSelectedIndex = currentSelected;
  if (currentSelected === index) {
    newSelectedIndex = index + 1;
  } else if (currentSelected === index + 1) {
    newSelectedIndex = index;
  }

  painter.selectLayer(newSelectedIndex);
  ```
- **localStorage統合**: 各UIパネル（toolbar、brushbar、layer-panel）の位置を個別に保存
  - キー: `wrapper-position-${draggableId}`
  - 値: `{ x: number, y: number }`のJSON

### スタビライザー
- `toolStabilizeLevel`: 補正の強度（0で無効、大きいほど強力）
- `toolStabilizeWeight`: 追従の重み（0〜0.95）
- タイマーベースで遅延描画を実現

### パフォーマンス最適化
- DirtyRect方式でUndo/Redoのメモリ使用量を削減
- `requestAnimationFrame`ではなく`setInterval`でtick処理
- knockout（抜き描画）モードでは`beforeKnockout`キャンバスにバックアップ

## テスト

現在テストは未実装です。テストを追加する場合は、以下の領域をカバーすることを推奨します：
- ブラシの描画ロジック
- Undo/Redoスタックの動作
- レイヤー操作（追加、削除、入れ替え）
- スタビライザーの座標補正

## Storybook

UIコンポーネントのデモとドキュメントをStorybookで管理しています。
デプロイ先: https://react-rich-painter.vercel.app
