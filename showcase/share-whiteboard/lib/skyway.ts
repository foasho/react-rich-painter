import { SkyWayAuthToken, uuidV4, nowInSec } from '@skyway-sdk/token';

/**
 * SkyWay認証トークンを生成
 */
export function generateSkyWayToken(roomName: string, memberId: string): string {
  const appId = process.env.SKYWAY_APP_ID;
  const secretKey = process.env.SKYWAY_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error('SkyWay credentials are not configured');
  }

  const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24, // 24時間有効
    scope: {
      app: {
        id: appId,
        turn: true,
        actions: ['read'],
        channels: [
          {
            id: '*',
            name: roomName,
            actions: ['write'],
            members: [
              {
                id: memberId,
                name: '*',
                actions: ['write'],
                publication: {
                  actions: ['write'],
                },
                subscription: {
                  actions: ['write'],
                },
              },
            ],
            sfuBots: [
              {
                actions: ['write'],
                forwardings: [
                  {
                    actions: ['write'],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  }).encode(secretKey);

  return token;
}

/**
 * ユーザー識別用のランダムカラーを生成
 */
export function generateUserColor(): string {
  const colors = [
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#14B8A6', // teal
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

