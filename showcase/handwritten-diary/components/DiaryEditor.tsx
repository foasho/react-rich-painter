'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  DiaryEntry, 
  saveDiaryEntry, 
  generateId, 
  generatePreviewFromState,
  PainterState
} from '@/lib/storage';

// SSRを無効化してreact-rich-painterをインポート
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactRichPainter = dynamic<any>(
  // @ts-expect-error - react-rich-painter has no type declarations
  () => import('react-rich-painter').then(mod => mod.ReactRichPainter),
  { ssr: false }
);

interface DiaryEditorProps {
  entry?: DiaryEntry | null;
}

export default function DiaryEditor({ entry }: DiaryEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(entry?.title || '');
  const [date, setDate] = useState(entry?.date || new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const painterStateRef = useRef<PainterState | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 既存エントリからPainterStateを復元
  const initialState = useMemo(() => {
    if (entry?.painterState) {
      try {
        return JSON.parse(entry.painterState) as PainterState;
      } catch (error) {
        console.error('Failed to parse painterState:', error);
        return undefined;
      }
    }
    return undefined;
  }, [entry?.painterState]);

  // 描画状態の更新を追跡
  const handlePainterUpdate = useCallback((state: PainterState) => {
    painterStateRef.current = state;
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let imageData = '';
      let painterStateJson = '';

      // PainterStateから画像データとJSON状態を取得
      if (painterStateRef.current) {
        // プレビュー画像を生成
        imageData = await generatePreviewFromState(painterStateRef.current);
        // PainterStateをJSON化して保存（再編集用）
        painterStateJson = JSON.stringify(painterStateRef.current);
      }

      const diaryEntry: DiaryEntry = {
        id: entry?.id || generateId(),
        title: title || `${date}の日記`,
        date,
        imageData,
        painterState: painterStateJson,
        createdAt: entry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveDiaryEntry(diaryEntry);
      router.push('/');
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (confirm('変更を破棄してもよろしいですか？')) {
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* ヘッダー */}
      <header className="shrink-0 px-6 py-4 border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 flex items-center gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力..."
              className="flex-1 bg-transparent border-none text-base font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                保存中
              </>
            ) : (
              '保存'
            )}
          </button>
        </div>
      </header>

      {/* キャンバスエリア */}
      <main className="flex-1 overflow-hidden bg-white">
        {isClient && (
          <ReactRichPainter
            autoSize={true}
            preset="notebook"
            toolbar={false}
            brushbar={false}
            defaultCustomBrush={false}
            backgroundSize={25}
            onUpdate={handlePainterUpdate}
            initialState={initialState}
          />
        )}
      </main>
    </div>
  );
}
