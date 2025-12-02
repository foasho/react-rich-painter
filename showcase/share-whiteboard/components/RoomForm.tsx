'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !userName.trim()) {
      setError('ルーム名とユーザー名を入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ルームを作成
      const createRes = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          password: password || undefined,
        }),
      });

      if (!createRes.ok) {
        throw new Error('ルームの作成に失敗しました');
      }

      const { roomId: newRoomId } = await createRes.json();

      // ルームに参加
      const joinRes = await fetch(`/api/rooms/${newRoomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          password: password || undefined,
        }),
      });

      if (!joinRes.ok) {
        throw new Error('ルームへの参加に失敗しました');
      }

      const joinData = await joinRes.json();

      // ルームページに遷移（クエリパラメータで情報を渡す）
      const params = new URLSearchParams({
        userId: joinData.userId,
        userName,
        userColor: joinData.userColor,
        token: joinData.skywayToken,
        roomName,
      });
      router.push(`/room/${newRoomId}?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !userName.trim()) {
      setError('ルームIDとユーザー名を入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ルーム情報を取得
      const roomRes = await fetch(`/api/rooms/${roomId}`);
      if (!roomRes.ok) {
        throw new Error('ルームが見つかりません');
      }
      const roomData = await roomRes.json();

      // ルームに参加
      const joinRes = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          password: password || undefined,
        }),
      });

      if (!joinRes.ok) {
        const errorData = await joinRes.json();
        throw new Error(errorData.error || 'ルームへの参加に失敗しました');
      }

      const joinData = await joinRes.json();

      // ルームページに遷移
      const params = new URLSearchParams({
        userId: joinData.userId,
        userName,
        userColor: joinData.userColor,
        token: joinData.skywayToken,
        roomName: roomData.name,
      });
      router.push(`/room/${roomId}?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* タブ */}
      <div className="flex mb-6">
        <button
          onClick={() => { setMode('create'); setError(null); }}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            mode === 'create'
              ? 'border-blue-500 text-blue-400'
              : 'border-zinc-700 text-zinc-400 hover:text-zinc-300'
          }`}
        >
          ルームを作成
        </button>
        <button
          onClick={() => { setMode('join'); setError(null); }}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            mode === 'join'
              ? 'border-blue-500 text-blue-400'
              : 'border-zinc-700 text-zinc-400 hover:text-zinc-300'
          }`}
        >
          ルームに参加
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={mode === 'create' ? handleCreateRoom : handleJoinRoom} className="space-y-4">
        {mode === 'create' ? (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              ルーム名
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="例: デザインミーティング"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              ルームID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="ルームIDを入力"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            あなたの名前
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="表示名を入力"
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            パスワード <span className="text-zinc-500">(任意)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを設定"
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '処理中...' : mode === 'create' ? 'ルームを作成' : 'ルームに参加'}
        </button>
      </form>
    </div>
  );
}

