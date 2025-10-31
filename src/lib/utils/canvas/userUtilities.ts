
/**
* ユーザーのデバイス種別を取得する
* @return {string} デバイス種別
**/
export type DeviceType = 'ios' | 'android' | 'other';
export const getDeviceType = (): DeviceType => {
  const ua = navigator.userAgent;
  if (ua.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('iPad') > 0) {
    return 'ios';
  } else if (ua.indexOf('Android') > 0) {
    return 'android';
  } else {
    return 'other';
  }
};

