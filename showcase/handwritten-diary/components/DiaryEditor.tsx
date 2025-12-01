'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DiaryEntry, saveDiaryEntry, generateId } from '@/lib/storage';

// SSRを無効化してreact-rich-painterをインポート
const ReactRichPainter = dynamic(
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
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // キャンバスから画像データを取得
      const canvas = canvasContainerRef.current?.querySelector('canvas');
      let imageData = '';
      
      if (canvas) {
        imageData = canvas.toDataURL('image/png');
      }

      const diaryEntry: DiaryEntry = {
        id: entry?.id || generateId(),
        title: title || `${date}の日記`,
        date,
        imageData,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#fafafa' }}>
      {/* ヘッダー */}
      <header style={{ 
        flexShrink: 0,
        padding: '16px 24px',
        borderBottom: '1px solid #e4e4e7',
        backgroundColor: '#fff'
      }}>
        <div style={{ 
          maxWidth: '1152px', 
          margin: '0 auto', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <button
            onClick={handleBack}
            style={{
              padding: '8px',
              color: '#71717a',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#18181b';
              e.currentTarget.style.backgroundColor = '#f4f4f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#71717a';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力..."
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '16px',
                fontWeight: 500,
                color: '#18181b',
                outline: 'none'
              }}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                backgroundColor: '#f4f4f5',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '14px',
                color: '#3f3f46',
                outline: 'none'
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: '#18181b',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              border: 'none',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = '#27272a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = '#18181b';
              }
            }}
          >
            {isSaving ? (
              <>
                <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
      <main style={{ flex: 1, overflow: 'hidden', backgroundColor: '#fff' }} ref={canvasContainerRef}>
        {isClient && (
          <ReactRichPainter
            autoSize={true}
            preset="notebook"
            toolbar={false}
            brushbar={false}
            defaultCustomBrush={false}
            backgroundSize={25}
          />
        )}
      </main>
    </div>
  );
}
