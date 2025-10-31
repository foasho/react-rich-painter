<div align="center">
<img src="https://github.com/user-attachments/assets/882ba142-0fd8-4c34-857c-014de5c79bd8" width="200" />

# 🎨　React Rich Painter

React Rich Painterは、
Reactで統合可能なPainterライブラリです。


[Demo on Storybook](https://story-book-react-rich-painter.vercel.app)

## ショーケース

(準備中)

</div>

## 特徴🌴
* ノート利用とペイントツール利用が可能
* マウス入力 / タッチ入力 / ペン入力🚀
  * **スマート入力切り替え**: ペン入力を最優先し、使用パターンに応じて自動的に入力タイプを切り替え✨
* Webでの本格的でなめらかな線👥
* **レイヤー機能**: 最大30レイヤーのサポート、名前編集、可視化・不透明度調整、順序変更、ドラッグ可能なパネル📱
* ブラシ機能 / スポイト機能 などの豊富な機能拡張🎨
* 最適化された軽量なライブラリ💥
* NextJS / Vite などReactに統合可能なTSの柔軟なライブラリ🤖
* UI位置の自動保存（localStorage統合）💾

### Usage💡

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

## 開発者 / Contributor

fork後にPRを出してください。

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm run build
```

### Storybookで確認

Storybookを使用して、様々なパラメータでReact Rich Painterをインタラクティブにテストできます。

```bash
# Storybookの起動
npm run storybook
```

ブラウザで `http://localhost:6006` を開く

### Storybookのビルド

```bash
# Storybookの静的ファイルを生成
npm run build-storybook
```
