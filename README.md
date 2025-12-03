<div align="center">
<img src="https://github.com/user-attachments/assets/882ba142-0fd8-4c34-857c-014de5c79bd8" width="200" />

# 🎨　React Rich Painter

React Rich Painterは、
Reactで統合可能なPainterライブラリです。


[Demo on Storybook](https://story-book-react-rich-painter.vercel.app)



## ショーケース

[![ペイントアプリ](https://github.com/user-attachments/assets/7c31ce76-f653-408c-90e6-0f26494ae2f1)](https://simple-painter.vercel.app/) [![手書き日記](https://github.com/user-attachments/assets/f06062ec-86b9-4b0f-8a83-6d502e3e97b0)](https://handwritten-diary.vercel.app/) [![共有ホワイトボード](https://github.com/user-attachments/assets/c93cfbe7-3c35-4810-8ba2-b054b45f59ba)](https://share-whiteboard.vercel.app/)

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
- `onUpdate?: (state: PainterState) => void` - Painter状態更新時のコールバック（100msでthrottleされます）
- `initialState?: PainterState` - 初期状態（Import機能）
- `showFileMenu?: boolean` - FileMenuを表示するかどうか（デフォルト: `false`）

#### 共有機能（Share）

リアルタイム共有ホワイトボードを構築するためのプロパティです。`share=true`の場合のみ有効になります。

- `share?: boolean` - 共有モードを有効にするか（デフォルト: `false`）
- `userId?: string` - 共有モード時のユーザー識別子
- `userName?: string` - 共有モード時のユーザー表示名
- `onStrokeStart?: (data: StrokeStartData) => void` - ストローク開始時のコールバック
- `onStrokeMove?: (data: StrokeMoveData) => void` - ストローク移動時のコールバック
- `onStrokeEnd?: (data: StrokeEndData) => void` - ストローク終了時のコールバック

共有モードでは、`ref`を使用して外部からリモートユーザーの描画を適用できます：

```tsx
import { ReactRichPainter, PainterHandle } from "react-rich-painter";
import { useRef } from "react";

function SharedWhiteboard() {
  const painterRef = useRef<PainterHandle>(null);
  
  // リモートからのストロークを適用
  const handleRemoteStroke = (data) => {
    painterRef.current?.applyRemoteStrokeStart(data);
    // applyRemoteStrokeMove, applyRemoteStrokeEnd も同様
  };
  
  return (
    <ReactRichPainter
      ref={painterRef}
      share={true}
      userId="user-123"
      userName="田中"
      onStrokeStart={(data) => sendToServer(data)}
      onStrokeMove={(data) => sendToServer(data)}
      onStrokeEnd={(data) => sendToServer(data)}
    />
  );
}
```

### スマート入力切り替え機能

React Rich Painterは、ユーザーの使用パターンに基づいて入力タイプ（ペン/マウス/タッチ）を自動的に切り替える機能を搭載しています。

#### 動作ルール

1. **ペン入力の最優先**: ペン入力が検知されると即座にペンモードに切り替わります
2. **使用パターンの追跡**: ペンモード中に他の入力（マウス/タッチ）を連続して使用すると、自動的にその入力タイプに切り替わります
3. **手動切り替えも可能**: ツールバーの入力タイプボタンで手動切り替えもできます

この機能により、ペンタブレットとマウス、タッチデバイスを併用する環境でも快適に描画できます。

### Import/Export機能

React Rich Painterは、描画状態を完全に保存・復元できるImport/Export機能を提供しています。

#### UIからのImport/Export（showFileMenu prop）

```tsx
import { ReactRichPainter } from "react-rich-painter";

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* showFileMenu=trueでToolBar/NotebookBarにFileメニューが表示されます */}
      <ReactRichPainter showFileMenu={true} />
    </div>
  );
}
```

FileMenuから以下の操作が可能です：
- **ファイルを開く**: JSONファイルから描画状態を復元
- **エクスポート**: 現在の描画状態をJSONファイルとして保存
- **画像を保存**: 統合されたキャンバス画像をPNG形式で保存

#### プログラムからのImport/Export

```tsx
import {
  ReactRichPainter,
  PainterState,
  exportPainterState,
  serializePainterState
} from "react-rich-painter";
import { useState } from "react";

function App() {
  const [savedState, setSavedState] = useState<PainterState | undefined>();

  const handleUpdate = (state: PainterState) => {
    // 状態が更新されるたびに呼ばれます（100msでthrottle）
    console.log('Painter state updated:', state);
    setSavedState(state);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* onUpdateで状態変更を監視 */}
      <ReactRichPainter
        onUpdate={handleUpdate}
        initialState={savedState} // 保存した状態から復元
      />

      {savedState && (
        <button onClick={() => {
          // JSONとしてエクスポート
          const json = serializePainterState(savedState);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'painting.json';
          link.click();
        }}>
          エクスポート
        </button>
      )}
    </div>
  );
}
```

#### PainterStateの構造

```typescript
type PainterState = {
  version: string; // フォーマットバージョン
  canvas: {
    width: number;
    height: number;
  };
  layers: Array<{
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    imageData: string; // Base64エンコードされた画像データ
  }>;
  selectedLayerId: string;
  brush: {
    color: string;
    size: number;
    spacing: number;
    flow: number;
    merge: number;
    minimumSize: number;
    opacity: number;
  };
  stabilizer: {
    level: number;
    weight: number;
  };
  currentTool: 'pen' | 'eraser' | 'dripper' | 'lasso' | 'move';
  inputType: 'pen' | 'mouse' | 'touch';
};
```

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
