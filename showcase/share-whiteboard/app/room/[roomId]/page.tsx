"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import WhiteboardCanvas from "@/components/WhiteboardCanvas";

interface RoomInfo {
  id: string;
  name: string;
  hasPassword: boolean;
  maxUsers: number;
}

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = params.roomId as string;
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName");
  const userColor = searchParams.get("userColor");
  const token = searchParams.get("token");
  const roomName = searchParams.get("roomName");

  // 参加済みかどうか
  const isJoined = userId && userName && userColor && token && roomName;

  // 未参加時の状態
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(!isJoined);
  const [error, setError] = useState<string | null>(null);
  const [inputUserName, setInputUserName] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // ルーム情報を取得
  useEffect(() => {
    if (isJoined) return;

    const fetchRoomInfo = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError(
              "ルームが見つかりません。削除されたか、有効期限が切れた可能性があります。",
            );
          } else {
            setError("ルーム情報の取得に失敗しました");
          }
          return;
        }
        const data = await res.json();
        setRoomInfo(data);
      } catch (err) {
        setError("ルーム情報の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomInfo();
  }, [roomId, isJoined]);

  // ルームに参加
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUserName.trim()) {
      setJoinError("名前を入力してください");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const joinRes = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: inputUserName,
          password: roomInfo?.hasPassword ? inputPassword : undefined,
        }),
      });

      if (!joinRes.ok) {
        const errorData = await joinRes.json();
        throw new Error(errorData.error || "ルームへの参加に失敗しました");
      }

      const joinData = await joinRes.json();

      // URLを更新して参加状態にする
      const newParams = new URLSearchParams({
        userId: joinData.userId,
        userName: inputUserName,
        userColor: joinData.userColor,
        token: joinData.skywayToken,
        roomName: roomInfo?.name || "",
      });

      // ページをリロードして新しいパラメータで表示
      window.location.href = `/room/${roomId}?${newParams.toString()}`;
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsJoining(false);
    }
  };

  // 参加済みの場合はWhiteboardCanvasを表示
  if (isJoined) {
    return (
      <WhiteboardCanvas
        roomId={roomId}
        roomName={roomName}
        userId={userId}
        userName={userName}
        userColor={userColor}
        skywayToken={token}
      />
    );
  }

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-zinc-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // 参加フォーム
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
      <div className="w-full max-w-md mx-4 p-8 bg-zinc-800/50 border border-zinc-700 rounded-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">ルームに参加</h1>
          <div className="p-3 bg-zinc-900/50 rounded-lg">
            <p className="text-sm text-zinc-400">ルーム名</p>
            <p className="font-medium text-white">{roomInfo?.name}</p>
          </div>
        </div>

        {joinError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {joinError}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              あなたの名前
            </label>
            <input
              type="text"
              value={inputUserName}
              onChange={(e) => setInputUserName(e.target.value)}
              placeholder="表示名を入力"
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {roomInfo?.hasPassword && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="パスワードを入力"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 py-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isJoining || !inputUserName.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "参加中..." : "参加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
