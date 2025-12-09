import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getRedisClient, ROOM_KEY_PREFIX } from "@/lib/redis";
import { generateSkyWayToken, generateUserColor } from "@/lib/skyway";
import type { Room, JoinRoomRequest, JoinRoomResponse } from "@/lib/types";

// 簡易的なパスワード検証（本番環境ではbcryptを使用）
function verifyPassword(input: string, hashed: string): boolean {
  return Buffer.from(input).toString("base64") === hashed;
}

type Params = { params: Promise<{ roomId: string }> };

/**
 * ルームに参加
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { roomId } = await params;
    const body: JoinRoomRequest = await request.json();

    if (!body.userName || body.userName.trim() === "") {
      return NextResponse.json<JoinRoomResponse>(
        {
          success: false,
          userId: "",
          skywayToken: "",
          room: { id: "", name: "" },
          error: "User name is required",
        },
        { status: 400 },
      );
    }

    const redis = getRedisClient();
    const roomData = await redis.get(`${ROOM_KEY_PREFIX}${roomId}`);

    if (!roomData) {
      return NextResponse.json<JoinRoomResponse>(
        {
          success: false,
          userId: "",
          skywayToken: "",
          room: { id: "", name: "" },
          error: "Room not found",
        },
        { status: 404 },
      );
    }

    const room: Room = JSON.parse(roomData);

    // パスワード検証
    if (room.hasPassword && room.password) {
      if (!body.password || !verifyPassword(body.password, room.password)) {
        return NextResponse.json<JoinRoomResponse>(
          {
            success: false,
            userId: "",
            skywayToken: "",
            room: { id: "", name: "" },
            error: "Invalid password",
          },
          { status: 401 },
        );
      }
    }

    // ユーザーIDを生成
    const userId = uuidv4();

    // SkyWayトークンを生成
    const skywayToken = generateSkyWayToken(roomId, userId);

    return NextResponse.json<JoinRoomResponse>({
      success: true,
      userId,
      skywayToken,
      room: {
        id: room.id,
        name: room.name,
      },
      userColor: generateUserColor(),
    } as JoinRoomResponse & { userColor: string });
  } catch (error) {
    console.error("Failed to join room:", error);
    return NextResponse.json<JoinRoomResponse>(
      {
        success: false,
        userId: "",
        skywayToken: "",
        room: { id: "", name: "" },
        error: "Failed to join room",
      },
      { status: 500 },
    );
  }
}
