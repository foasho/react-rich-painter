<div align="center">
<img src="https://github.com/user-attachments/assets/8acfcd39-6028-4c82-b871-d59f10c30b69" width="200" />

# [WIP] Web Rich Painter in React🎨

## This project is Work In Progress now.

[Painter機能](https://github.com/user-attachments/assets/8b17c822-145f-4f95-96fd-ba266de453b4)

[Storybook](https://react-rich-painter.vercel.app)

React Rich Painterは、Reactで統合可能なPainterライブラリです。

## ショーケース

(準備中)

</div>

- Node22
- React19

## 特徴🌴
* マウス入力 / タッチ入力 / ペン入力🚀
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
```

### プロパティ

- `autoSize?: boolean` - 親要素のサイズから自動的にキャンバスサイズを決定するかどうか（デフォルト: `true`）
  - `true`: 親要素のサイズの0.8倍が自動的にキャンバスサイズとして設定されます
  - `false`: `width`と`height`プロパティで固定サイズを指定する必要があります
- `width?: number` - キャンバスの幅（ピクセル）※`autoSize=false`の場合に使用
- `height?: number` - キャンバスの高さ（ピクセル）※`autoSize=false`の場合に使用
- `toolbar?: boolean` - ツールバーを表示するかどうか（デフォルト: `true`）
- `brushbar?: boolean` - ブラシバーを表示するかどうか（デフォルト: `true`）
- `defaultCustomBrush?: boolean` - デフォルトのカスタムブラシを使用するかどうか（デフォルト: `true`）
- `backgroundSize?: number` - 背景グリッドのサイズ（ピクセル）（デフォルト: `20`）

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
