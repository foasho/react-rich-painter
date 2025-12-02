# Share Whiteboard

リアルタイムで共有できるホワイトボードアプリケーション。
[react-rich-painter](https://www.npmjs.com/package/react-rich-painter) と [SkyWay](https://skyway.ntt.com/) を使用したP2P通信で、複数人が同時に描画できます。

## 機能

- 🎨 **リアルタイム共有描画**: P2P接続で直接つながり、描画内容がリアルタイムに共有されます
- 🔒 **パスワード保護**: ルームにパスワードを設定できます
- 👥 **参加者表示**: 誰が描画中かをリアルタイムで確認できます
- 🖼️ **レイヤー情報共有**: 他のユーザーがどのレイヤーで描画しているかがわかります
- ⏰ **一時的なルーム**: ルームは24時間後に自動削除されます

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集して、以下の値を設定してください：

```env
# SkyWay
SKYWAY_APP_ID=your_app_id_here
SKYWAY_SECRET_KEY=your_secret_key_here

# Redis
REDIS_URL=redis://localhost:6379
```

### 2. SkyWayの設定

1. [SkyWay](https://skyway.ntt.com/) でアカウントを作成
2. 新しいアプリケーションを作成
3. App IDとSecret Keyを取得
4. `.env`ファイルに設定

### 3. Redisの起動

```bash
# Dockerを使用する場合
docker run -d -p 6379:6379 redis:alpine

# または、ローカルにインストールされたRedisを起動
redis-server
```

### 4. 依存関係のインストールと起動

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

### ルームを作成する

1. 「ルームを作成」タブを選択
2. ルーム名と自分の名前を入力
3. 必要に応じてパスワードを設定
4. 「ルームを作成」をクリック

### ルームに参加する

1. 「ルームに参加」タブを選択
2. ルームIDと自分の名前を入力
3. パスワードが設定されている場合は入力
4. 「ルームに参加」をクリック

### ルームIDの共有

ルームに参加したら、ブラウザのURLバーからルームIDをコピーして、他の参加者に共有してください。

## 技術スタック

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Drawing**: react-rich-painter
- **Real-time Communication**: SkyWay (P2P WebRTC)
- **Temporary Storage**: Redis

## ライセンス

MIT
