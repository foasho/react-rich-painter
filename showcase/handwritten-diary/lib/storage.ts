// react-rich-painterから型をインポート
import type { PainterState } from 'react-rich-painter';
export type { PainterState };

// 日記エントリの型定義
export interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  imageData: string; // プレビュー用のBase64エンコードされた画像データ
  painterState?: string; // 再編集用のPainterState（JSON文字列）
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'handwritten-diary-entries';

/**
 * PainterStateからプレビュー画像を生成
 * すべてのレイヤーを統合した画像を返す
 */
export const generatePreviewFromState = async (state: PainterState): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = state.canvas.width;
    canvas.height = state.canvas.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // 背景を白で塗りつぶし
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 各レイヤーを順番に描画
    const loadAndDrawLayers = async () => {
      for (const layer of state.layers) {
        if (!layer.visible || !layer.imageData) continue;

        try {
          const img = await loadImage(layer.imageData);
          ctx.globalAlpha = layer.opacity;
          ctx.drawImage(img, 0, 0);
        } catch (error) {
          console.warn(`Failed to load layer image:`, error);
        }
      }
      ctx.globalAlpha = 1;
      resolve(canvas.toDataURL('image/png'));
    };

    loadAndDrawLayers().catch(reject);
  });
};

/**
 * Base64画像をImageオブジェクトとして読み込む
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// ローカルストレージから日記一覧を取得
export const getDiaryEntries = (): DiaryEntry[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// 日記を保存
export const saveDiaryEntry = (entry: DiaryEntry): void => {
  const entries = getDiaryEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
  } else {
    entries.unshift(entry);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

// 日記を取得
export const getDiaryEntry = (id: string): DiaryEntry | null => {
  const entries = getDiaryEntries();
  return entries.find(e => e.id === id) || null;
};

// 日記を削除
export const deleteDiaryEntry = (id: string): void => {
  const entries = getDiaryEntries();
  const filtered = entries.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// ユニークIDを生成
export const generateId = (): string => {
  return `diary-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// 日付をフォーマット
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

