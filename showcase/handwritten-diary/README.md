# Handwritten Diary - 手書き日記アプリ

[react-rich-painter](https://www.npmjs.com/package/react-rich-painter)を使用した手書き日記アプリのデモです。

## 機能

- ✏️ **手書き入力** - ペン、タッチ、マウスで日記を書ける
- 📅 **日付管理** - 日付ごとに日記を整理
- 💾 **ローカル保存** - LocalStorageに自動保存（DB不要）
- 🖼️ **サムネイル表示** - 日記一覧でプレビュー表示
- 🗑️ **削除機能** - 不要な日記を削除

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

http://localhost:3000 でアクセスできます。

## 使用技術

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型付きJavaScript
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [react-rich-painter](https://www.npmjs.com/package/react-rich-painter) - ペイントライブラリ

## 画面構成

- **ホーム画面** (`/`) - 日記一覧
- **新規作成** (`/new`) - 新しい日記を作成
- **編集画面** (`/diary/[id]`) - 既存の日記を編集

## データ保存

日記データはブラウザのLocalStorageに保存されます。
サーバーサイドのデータベースは使用しないため、同じブラウザでのみデータが保持されます。

## コード例

```tsx
import { ReactRichPainter } from "react-rich-painter";

// Notebookプリセットを使用したシンプルな手書きエディタ
<ReactRichPainter
  autoSize={true}
  preset="notebook"
  toolbar={false}
  brushbar={false}
/>;
```
