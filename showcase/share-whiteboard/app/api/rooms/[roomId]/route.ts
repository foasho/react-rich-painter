import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, ROOM_KEY_PREFIX, ROOM_LIST_KEY } from '@/lib/redis';
import type { Room } from '@/lib/types';

type Params = { params: Promise<{ roomId: string }> };

/**
 * ルーム情報を取得
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { roomId } = await params;
    const redis = getRedisClient();
    const roomData = await redis.get(`${ROOM_KEY_PREFIX}${roomId}`);
    
    if (!roomData) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    const room: Room = JSON.parse(roomData);
    
    // パスワードは返さない
    return NextResponse.json({
      id: room.id,
      name: room.name,
      hasPassword: room.hasPassword,
      maxUsers: room.maxUsers,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
    });
  } catch (error) {
    console.error('Failed to get room:', error);
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 });
  }
}

/**
 * ルームを削除
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { roomId } = await params;
    const redis = getRedisClient();
    
    // ルームを削除
    await redis.del(`${ROOM_KEY_PREFIX}${roomId}`);
    await redis.srem(ROOM_LIST_KEY, roomId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}

