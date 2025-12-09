"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  name: string;
  hasPassword: boolean;
  maxUsers: number;
  createdAt: string;
}

interface RoomListProps {
  onCreateClick: () => void;
}

const ITEMS_PER_PAGE = 10;
const MAX_AGE_MINUTES = 10; // 10分以上前のルームは非表示

export default function RoomList({ onCreateClick }: RoomListProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // パスワード入力モーダル
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // 10分以内のルームのみをフィルタリング
  const recentRooms = rooms.filter((room) => {
    const createdAt = new Date(room.createdAt).getTime();
    const now = Date.now();
    const ageMinutes = (now - createdAt) / (1000 * 60);
    return ageMinutes <= MAX_AGE_MINUTES;
  });

  // ページネーション計算
  const totalPages = Math.ceil(recentRooms.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRooms = recentRooms.slice(startIndex, endIndex);

  // ルーム一覧を取得
  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("ルーム一覧の取得に失敗しました");
      const data = await res.json();
      setRooms(data.rooms || []);
      // ページが範囲外になった場合はリセット
      const filteredRooms = (data.rooms || []).filter((room: Room) => {
        const createdAt = new Date(room.createdAt).getTime();
        const now = Date.now();
        const ageMinutes = (now - createdAt) / (1000 * 60);
        return ageMinutes <= MAX_AGE_MINUTES;
      });
      const newTotalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // 10秒ごとに更新
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  // ルームに参加
  const handleJoinRoom = async (room: Room) => {
    if (!userName.trim()) {
      setJoinError("名前を入力してください");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const joinRes = await fetch(`/api/rooms/${room.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          password: room.hasPassword ? password : undefined,
        }),
      });

      if (!joinRes.ok) {
        const errorData = await joinRes.json();
        throw new Error(errorData.error || "ルームへの参加に失敗しました");
      }

      const joinData = await joinRes.json();

      // ルームページに遷移
      const params = new URLSearchParams({
        userId: joinData.userId,
        userName,
        userColor: joinData.userColor,
        token: joinData.skywayToken,
        roomName: room.name,
      });
      router.push(`/room/${room.id}?${params.toString()}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsJoining(false);
    }
  };

  // ルームカードをクリック
  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setPassword("");
    setJoinError(null);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setSelectedRoom(null);
    setPassword("");
    setJoinError(null);
  };

  // 日時フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-white">公開中のルーム</h2>
        <button
          onClick={() => fetchRooms()}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
          title="更新"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {recentRooms.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-zinc-400 mb-4">公開中のルームはありません</p>
          <p className="text-xs text-zinc-500 mb-4">
            （10分以内に作成されたルームのみ表示）
          </p>
          <button
            onClick={onCreateClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            ルームを作成
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {currentRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-left hover:bg-zinc-800 hover:border-zinc-600 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                      {room.name}
                    </h3>
                    {room.hasPassword && (
                      <svg
                        className="w-4 h-4 text-zinc-500 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    作成: {formatDate(room.createdAt)}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <span className="text-xs text-zinc-500">
                    最大 {room.maxUsers}人
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* 件数表示 */}
      {recentRooms.length > 0 && (
        <p className="text-center text-xs text-zinc-500 mt-4">
          {recentRooms.length}件のルーム（10分以内）
        </p>
      )}

      {/* 参加モーダル */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-6 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">ルームに参加</h3>
              <button
                onClick={closeModal}
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

            <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg">
              <p className="text-sm text-zinc-400">参加するルーム</p>
              <p className="font-medium text-white">{selectedRoom.name}</p>
            </div>

            {joinError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {joinError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  あなたの名前
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="表示名を入力"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              {selectedRoom.hasPassword && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    パスワード
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleJoinRoom(selectedRoom)}
                  disabled={isJoining || !userName.trim()}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? "参加中..." : "参加する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
