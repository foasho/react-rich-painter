'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type {
  PainterHandle,
  StrokeStartData,
  StrokeMoveData,
  StrokeEndData,
  PainterState,
} from 'react-rich-painter';

// SSRを無効化
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactRichPainter = dynamic<any>(
  () => import('react-rich-painter').then(mod => mod.ReactRichPainter),
  { ssr: false }
);

interface WhiteboardCanvasProps {
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  userColor: string;
  skywayToken: string;
}

type WhiteboardMessage =
  | { type: 'stroke_start'; data: StrokeStartData }
  | { type: 'stroke_move'; data: StrokeMoveData }
  | { type: 'stroke_end'; data: StrokeEndData }
  | { type: 'sync_request'; userId: string }
  | { type: 'sync_response'; data: PainterState };

interface RemoteUser {
  id: string;
  name: string;
  color: string;
  isDrawing: boolean;
  layerIndex: number;
}

export default function WhiteboardCanvas({
  roomId,
  roomName,
  userId,
  userName,
  userColor,
  skywayToken,
}: WhiteboardCanvasProps) {
  const router = useRouter();
  const painterRef = useRef<PainterHandle>(null);
  const [isClient, setIsClient] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // SkyWay関連（any型で保持、動的インポートのため）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contextRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataStreamRef = useRef<any>(null);

  // メッセージ送信関数をrefで保持
  const sendMessageRef = useRef<((message: WhiteboardMessage) => void) | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 受信メッセージの処理
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReceivedMessage = useCallback((data: unknown, publisher: any) => {
    if (!publisher) return;
    
    try {
      const message = (typeof data === 'string' ? JSON.parse(data) : data) as WhiteboardMessage;
      
      switch (message.type) {
        case 'stroke_start':
          painterRef.current?.applyRemoteStrokeStart(message.data);
          setRemoteUsers(prev => prev.map(u => 
            u.id === message.data.userId 
              ? { ...u, isDrawing: true, layerIndex: message.data.layerIndex }
              : u
          ));
          break;
          
        case 'stroke_move':
          painterRef.current?.applyRemoteStrokeMove(message.data);
          break;
          
        case 'stroke_end':
          painterRef.current?.applyRemoteStrokeEnd(message.data);
          setRemoteUsers(prev => prev.map(u => 
            u.id === message.data.userId 
              ? { ...u, isDrawing: false }
              : u
          ));
          break;
          
        case 'sync_request':
          // 同期リクエストに応答
          const state = painterRef.current?.exportState();
          if (state && sendMessageRef.current) {
            sendMessageRef.current({ type: 'sync_response', data: state });
          }
          break;
          
        case 'sync_response':
          // 状態を復元
          painterRef.current?.importState(message.data);
          break;
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }, []);

  // SkyWayに接続
  useEffect(() => {
    if (!isClient) return;

    let cleanup = false;

    const connectToSkyWay = async () => {
      try {
        // SkyWay SDKを動的にインポート
        const { SkyWayContext, SkyWayRoom } = await import('@skyway-sdk/room');

        if (cleanup) return;

        // SkyWayコンテキストを作成
        const context = await SkyWayContext.Create(skywayToken);
        contextRef.current = context;

        if (cleanup) {
          context.dispose();
          return;
        }

        // P2Pルームに参加または作成
        const room = await SkyWayRoom.FindOrCreate(context, {
          type: 'p2p',
          name: roomId,
        });
        roomRef.current = room;

        if (cleanup) {
          context.dispose();
          return;
        }

        // ルームに参加
        const member = await room.join({
          name: userName,
          metadata: JSON.stringify({ color: userColor }),
        });
        memberRef.current = member;

        // SkyWayStreamFactoryを使用してDataStreamを作成
        const { SkyWayStreamFactory } = await import('@skyway-sdk/core');
        const dataStream = await SkyWayStreamFactory.createDataStream();
        dataStreamRef.current = dataStream;

        // メッセージ送信関数を設定
        sendMessageRef.current = (message: WhiteboardMessage) => {
          try {
            dataStream.write(JSON.stringify(message));
          } catch (error) {
            console.error('Failed to send message:', error);
          }
        };

        await member.publish(dataStream);

        setIsConnected(true);

        // 新しいメンバーの参加を監視
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        room.onMemberJoined.add(({ member: newMember }: any) => {
          console.log('Member joined:', newMember.name);
          setRemoteUsers(prev => {
            if (prev.some(u => u.id === newMember.id)) return prev;
            const metadata = newMember.metadata ? JSON.parse(newMember.metadata) : {};
            return [...prev, {
              id: newMember.id,
              name: newMember.name || 'Unknown',
              color: metadata.color || '#888888',
              isDrawing: false,
              layerIndex: 0,
            }];
          });
        });

        // メンバーの退出を監視
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        room.onMemberLeft.add(({ member: leftMember }: any) => {
          console.log('Member left:', leftMember.name);
          setRemoteUsers(prev => prev.filter(u => u.id !== leftMember.id));
          painterRef.current?.clearRemoteUser(leftMember.id);
        });

        // データストリームの購読ヘルパー関数
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscribeToDataStream = async (publication: any) => {
          if (publication.contentType !== 'data') return;
          if (publication.publisher?.id === member.id) return;
          
          const { stream } = await member.subscribe(publication.id);
          // RemoteDataStreamのonDataイベントでデータを受信
          stream.onData.add((data: string) => {
            handleReceivedMessage(data, publication.publisher);
          });
        };

        // 新しいストリームの購読を監視
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        room.onStreamPublished.add(async ({ publication }: any) => {
          await subscribeToDataStream(publication);
        });

        // 既存のストリームを購読
        for (const publication of room.publications) {
          await subscribeToDataStream(publication);
        }

      } catch (error) {
        console.error('Failed to connect to SkyWay:', error);
        setConnectionError('接続に失敗しました。再度お試しください。');
      }
    };

    connectToSkyWay();

    return () => {
      cleanup = true;
      memberRef.current?.leave();
      contextRef.current?.dispose();
    };
  }, [isClient, roomId, userName, userColor, skywayToken, handleReceivedMessage]);

  // メッセージ送信
  const sendMessage = useCallback((message: WhiteboardMessage) => {
    sendMessageRef.current?.(message);
  }, []);

  // ストロークイベントハンドラ
  const handleStrokeStart = useCallback((data: StrokeStartData) => {
    sendMessage({ type: 'stroke_start', data });
  }, [sendMessage]);

  const handleStrokeMove = useCallback((data: StrokeMoveData) => {
    sendMessage({ type: 'stroke_move', data });
  }, [sendMessage]);

  const handleStrokeEnd = useCallback((data: StrokeEndData) => {
    sendMessage({ type: 'stroke_end', data });
  }, [sendMessage]);

  // 退出処理
  const handleLeave = useCallback(() => {
    memberRef.current?.leave();
    router.push('/');
  }, [router]);

  if (connectionError) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{connectionError}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900">
      {/* ヘッダー */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-medium text-white">{roomName}</h1>
            <span className={`px-2 py-0.5 rounded text-xs ${
              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {isConnected ? '接続中' : '接続中...'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 参加者リスト */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">参加者:</span>
              <div className="flex -space-x-2">
                {/* 自分 */}
                <div
                  className="w-7 h-7 rounded-full border-2 border-zinc-800 flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: userColor }}
                  title={`${userName} (あなた)`}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                {/* リモートユーザー */}
                {remoteUsers.map(user => (
                  <div
                    key={user.id}
                    className={`w-7 h-7 rounded-full border-2 border-zinc-800 flex items-center justify-center text-xs font-medium text-white ${
                      user.isDrawing ? 'ring-2 ring-white/50' : ''
                    }`}
                    style={{ backgroundColor: user.color }}
                    title={`${user.name}${user.isDrawing ? ' (描画中 - レイヤー' + (user.layerIndex + 1) + ')' : ''}`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleLeave}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* キャンバス */}
      <main className="flex-1 overflow-hidden">
        {isClient && (
          <ReactRichPainter
            ref={painterRef}
            autoSize={true}
            preset="painting"
            share={true}
            userId={userId}
            userName={userName}
            onStrokeStart={handleStrokeStart}
            onStrokeMove={handleStrokeMove}
            onStrokeEnd={handleStrokeEnd}
            showFileMenu={false}
          />
        )}
      </main>
    </div>
  );
}
