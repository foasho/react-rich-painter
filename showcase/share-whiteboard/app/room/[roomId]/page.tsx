'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import WhiteboardCanvas from '@/components/WhiteboardCanvas';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const roomId = params.roomId as string;
  const userId = searchParams.get('userId');
  const userName = searchParams.get('userName');
  const userColor = searchParams.get('userColor');
  const token = searchParams.get('token');
  const roomName = searchParams.get('roomName');

  useEffect(() => {
    // 必要なパラメータがない場合はホームにリダイレクト
    if (!userId || !userName || !userColor || !token || !roomName) {
      router.push('/');
      return;
    }
    setIsLoading(false);
  }, [userId, userName, userColor, token, roomName, router]);

  if (isLoading || !userId || !userName || !userColor || !token || !roomName) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

