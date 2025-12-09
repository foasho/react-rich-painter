"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateRoomFormProps {
  onCancel: () => void;
}

export default function CreateRoomForm({ onCancel }: CreateRoomFormProps) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !userName.trim()) {
      setError("ルーム名とあなたの名前を入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ルームを作成
      const createRes = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName,
          password: password || undefined,
        }),
      });

      if (!createRes.ok) {
        throw new Error("ルームの作成に失敗しました");
      }

      const { roomId: newRoomId } = await createRes.json();

      // ルームに参加
      const joinRes = await fetch(`/api/rooms/${newRoomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          password: password || undefined,
        }),
      });

      if (!joinRes.ok) {
        throw new Error("ルームへの参加に失敗しました");
      }

      const joinData = await joinRes.json();

      // ルームページに遷移
      const params = new URLSearchParams({
        userId: joinData.userId,
        userName,
        userColor: joinData.userColor,
        token: joinData.skywayToken,
        roomName,
      });
      router.push(`/room/${newRoomId}?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-white">新しいルームを作成</h2>
        <button
          onClick={onCancel}
          className="p-1 text-zinc-400 hover:text-white rounded"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateRoom} className="space-y-4">
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
            autoFocus
          />
        </div>

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
          <p className="mt-1 text-xs text-zinc-500">
            設定すると、参加時にパスワードが必要になります
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "作成中..." : "ルームを作成"}
          </button>
        </div>
      </form>
    </div>
  );
}
