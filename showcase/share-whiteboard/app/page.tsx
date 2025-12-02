import RoomForm from '@/components/RoomForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Share Whiteboard
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            リアルタイムで共有できるホワイトボード。
            P2P接続で直接つながり、一緒に描画できます。
          </p>
        </div>

        {/* ルームフォーム */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8">
          <RoomForm />
        </div>

        {/* フッター */}
        <footer className="mt-16 text-center">
          <p className="text-xs text-zinc-500">
            Powered by{' '}
            <a
              href="https://www.npmjs.com/package/react-rich-painter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white"
            >
              react-rich-painter
            </a>
            {' '}+{' '}
            <a
              href="https://skyway.ntt.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white"
            >
              SkyWay
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
