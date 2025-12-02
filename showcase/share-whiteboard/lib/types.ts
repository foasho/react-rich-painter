/**
 * ルーム情報
 */
export interface Room {
  id: string;
  name: string;
  password?: string; // ハッシュ化されたパスワード
  hasPassword: boolean;
  maxUsers: number;
  createdAt: string;
  expiresAt: string; // 24時間後
  hostUserId: string;
}

/**
 * ルーム作成リクエスト
 */
export interface CreateRoomRequest {
  name: string;
  password?: string;
  maxUsers?: number;
}

/**
 * ルーム参加リクエスト
 */
export interface JoinRoomRequest {
  userName: string;
  password?: string;
}

/**
 * ルーム参加レスポンス
 */
export interface JoinRoomResponse {
  success: boolean;
  userId: string;
  skywayToken: string;
  room: {
    id: string;
    name: string;
  };
  error?: string;
}

/**
 * SkyWayトークン生成リクエスト
 */
export interface SkyWayTokenRequest {
  roomId: string;
  memberId: string;
}

/**
 * ルーム一覧レスポンス
 */
export interface RoomsListResponse {
  rooms: Array<{
    id: string;
    name: string;
    hasPassword: boolean;
    userCount?: number;
    maxUsers: number;
    createdAt: string;
  }>;
}

/**
 * ホワイトボード参加者情報
 */
export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  color: string; // ユーザー識別用の色
  isDrawing: boolean;
  currentLayerIndex: number;
}

/**
 * P2Pメッセージタイプ（再エクスポート）
 */
export type {
  StrokeStartData,
  StrokeMoveData,
  StrokeEndData,
  WhiteboardMessage,
  PainterState,
} from 'react-rich-painter';

