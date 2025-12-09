# Simple Painter

[react-rich-painter](https://www.npmjs.com/package/react-rich-painter)を使用したシンプルなペイントアプリのデモです。

## 機能

- 🖌️ ブラシ機能（筆圧対応）
- 🎨 カラーパレット
- 📚 レイヤー機能
- 🔧 ツール（ペン、消しゴム、投げ縄選択、スポイト）
- 📱 マルチ入力対応（マウス、タッチ、ペンタブレット）

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

## 使用技術

- [Vite](https://vitejs.dev/) - ビルドツール
- [React](https://react.dev/) - UIライブラリ
- [TypeScript](https://www.typescriptlang.org/) - 型付きJavaScript
- [react-rich-painter](https://www.npmjs.com/package/react-rich-painter) - ペイントライブラリ

## コード例

```tsx
import { ReactRichPainter } from "react-rich-painter";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactRichPainter
        autoSize={true}
        preset="painting"
        toolbar={true}
        brushbar={true}
        defaultCustomBrush={true}
      />
    </div>
  );
}
```
