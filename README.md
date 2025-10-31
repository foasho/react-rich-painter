<div align="center">
<img src="https://github.com/user-attachments/assets/882ba142-0fd8-4c34-857c-014de5c79bd8" width="200" />

# 🎨　React Rich Painter

React Rich Painterは、
Reactで統合可能なPainterライブラリです。


[Demo on Storybook](https://story-book-react-rich-painter.vercel.app)

## Usage Painter

```tsx
<ReactRichPainter preset='painter' />
```

## Usage Notebook

```tsx
<ReactRichPainter preset='notebook' />
```

## ショーケース

(準備中)

</div>

- Node22
- React19

## 特徴🌴
* ノート利用とペインター利用が可能
* マウス入力 / タッチ入力 / ペン入力🚀
  * **スマート入力切り替え**: ペン入力を最優先し、使用パターンに応じて自動的に入力タイプを切り替え✨
* Webでの本格的でなめらかな線👥
* **レイヤー機能**: 最大30レイヤーのサポート、名前編集、可視化・不透明度調整、順序変更、ドラッグ可能なパネル📱
* ブラシ機能 / スポイト機能 などの豊富な機能拡張🎨
* 最適化された軽量なライブラリ💥
* NextJS / Vite などReactに統合可能なTSの柔軟なライブラリ🤖
* UI位置の自動保存（localStorage統合）💾

### ビルドファイルをReactで読み込み💡

```bash
npm install react-rich-painter
# or
yarn add react-rich-painter
# or
pnpm install react-rich-painter
```

```tsx
import { ReactRichPainter } from "react-rich-painter";

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* autoSize=true（デフォルト）の場合、親要素のサイズの0.8倍が自動的に設定されます */}
      <ReactRichPainter />
    </div>
  );
}

// または固定サイズを指定する場合
function AppWithFixedSize() {
  return (
    <ReactRichPainter autoSize={false} width={800} height={600} />
  );
}

// Notebookプリセット：シンプルなメモ・スケッチ向け
function NotebookApp() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* 親要素いっぱいにキャンバスを配置し、必要最小限の機能のみ表示 */}
      <ReactRichPainter preset="notebook" />
    </div>
  );
}
```

### プロパティ

- `autoSize?: boolean` - 親要素のサイズから自動的にキャンバスサイズを決定するかどうか（デフォルト: `true`）
  - `true` (paintingモード): 親要素のサイズの0.8倍が自動的にキャンバスサイズとして設定されます
  - `true` (notebookモード): 親要素のサイズの1倍（親要素いっぱい）にキャンバスが配置されます
  - `false`: `width`と`height`プロパティで固定サイズを指定する必要があります
- `preset?: 'painting' | 'notebook'` - プリセット設定（デフォルト: `'painting'`）
  - `'painting'`: フル機能モード（ToolBar、BrushBar、レイヤーパネル）
  - `'notebook'`: シンプルモード（ペン・消しゴム・サイズ・色のみのNotebookBar）
- `width?: number` - キャンバスの幅（ピクセル）※`autoSize=false`の場合に使用
- `height?: number` - キャンバスの高さ（ピクセル）※`autoSize=false`の場合に使用
- `toolbar?: boolean` - ツールバーを表示するかどうか（デフォルト: `true`）※notebookプリセットでは無視されます
- `brushbar?: boolean` - ブラシバーを表示するかどうか（デフォルト: `true`）※notebookプリセットでは無視されます
- `defaultCustomBrush?: boolean` - デフォルトのカスタムブラシを使用するかどうか（デフォルト: `true`）
- `backgroundSize?: number` - 背景グリッドのサイズ（ピクセル）（デフォルト: `20`）

### スマート入力切り替え機能

React Rich Painterは、ユーザーの使用パターンに基づいて入力タイプ（ペン/マウス/タッチ）を自動的に切り替える機能を搭載しています。

#### 動作ルール

1. **ペン入力の最優先**: ペン入力が検知されると即座にペンモードに切り替わります
2. **使用パターンの追跡**: ペンモード中に他の入力（マウス/タッチ）を連続して使用すると、自動的にその入力タイプに切り替わります
3. **手動切り替えも可能**: ツールバーの入力タイプボタンで手動切り替えもできます

この機能により、ペンタブレットとマウス、タッチデバイスを併用する環境でも快適に描画できます。

## 開発者向け🛠️

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build
```

### Storybookで確認

Storybookを使用して、様々なパラメータでReact Rich Painterをインタラクティブにテストできます。

```bash
# Storybookの起動
npm run storybook
```

ブラウザで `http://localhost:6006` を開くと、Storybookが表示されます。

利用可能なストーリー：

**自動サイズ調整（autoSize=true）**
- **Default**: 親要素のサイズに自動調整（フルスクリーン）
- **AutoSizeSmallContainer**: 小さいコンテナでの自動サイズ調整
- **AutoSizeLargeContainer**: 大きいコンテナでの自動サイズ調整

**固定サイズ（autoSize=false）**
- **FixedSizeDefault**: 標準サイズ（800x600）
- **Small**: 小さいサイズ（400x300）
- **Large**: 大きいサイズ（1200x800）
- **Square**: 正方形（600x600）
- **Mobile**: モバイル向け（360x640）
- **Tablet**: タブレット向け（768x1024）
- **Widescreen**: ワイドスクリーン（1600x900）

**UI設定**
- **CanvasOnly**: ツールバーとブラシバーを非表示
- **WithToolbarOnly**: ツールバーのみ表示
- **WithBrushbarOnly**: ブラシバーのみ表示

**その他の設定**
- **WithoutCustomBrush**: カスタムブラシなし
- **FineGrid**: 細かい背景グリッド
- **CoarseGrid**: 粗い背景グリッド

Storybookの「Controls」タブから、以下のパラメータをリアルタイムで調整できます：
- `autoSize`: 自動サイズ調整の有効/無効
- `width`: キャンバスの幅（autoSize=falseの場合に使用）
- `height`: キャンバスの高さ（autoSize=falseの場合に使用）
- `toolbar`: ツールバーの表示/非表示
- `brushbar`: ブラシバーの表示/非表示
- `defaultCustomBrush`: デフォルトカスタムブラシの使用
- `backgroundSize`: 背景グリッドのサイズ

### Storybookのビルド

```bash
# Storybookの静的ファイルを生成
npm run build-storybook
```
