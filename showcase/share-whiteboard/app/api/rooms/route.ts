import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient, ROOM_KEY_PREFIX, ROOM_LIST_KEY, ROOM_TTL } from '@/lib/redis';
import type { Room, CreateRoomRequest, RoomsListResponse } from '@/lib/types';

// 簡易的なパスワードハッシュ（本番環境ではbcryptを使用）
function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

/**
 * ルーム一覧を取得
 */
export async function GET() {
  try {
    const redis = getRedisClient();
    const roomIds = await redis.smembers(ROOM_LIST_KEY);
    
    const rooms: RoomsListResponse['rooms'] = [];
    
    for (const roomId of roomIds) {
      const roomData = await redis.get(`${ROOM_KEY_PREFIX}${roomId}`);
      if (roomData) {
        const room: Room = JSON.parse(roomData);
        // パスワードは返さない
        rooms.push({
          id: room.id,
          name: room.name,
          hasPassword: room.hasPassword,
          maxUsers: room.maxUsers,
          createdAt: room.createdAt,
        });
      }
    }
    
    // 作成日時の新しい順にソート
    rooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Failed to get rooms:', error);
    return NextResponse.json({ error: 'Failed to get rooms' }, { status: 500 });
  }
}

/**
 * 新しいルームを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomRequest = await request.json();
    
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }
    
    const redis = getRedisClient();
    const roomId = uuidv4();
    const hostUserId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ROOM_TTL * 1000);
    
    const room: Room = {
      id: roomId,
      name: body.name.trim(),
      password: body.password ? hashPassword(body.password) : undefined,
      hasPassword: !!body.password,
      maxUsers: body.maxUsers || 10,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hostUserId,
    };
    
    // Redisに保存
    await redis.set(
      `${ROOM_KEY_PREFIX}${roomId}`,
      JSON.stringify(room),
      'EX',
      ROOM_TTL
    );
    
    // ルーム一覧に追加
    await redis.sadd(ROOM_LIST_KEY, roomId);
    
    return NextResponse.json({
      roomId,
      name: room.name,
      hostUserId,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
    });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

