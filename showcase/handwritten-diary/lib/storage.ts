// 日記エントリの型定義
export interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  imageData: string; // Base64エンコードされた画像データ
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'handwritten-diary-entries';

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

