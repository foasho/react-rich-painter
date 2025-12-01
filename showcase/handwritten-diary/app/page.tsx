'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DiaryEntry, getDiaryEntries } from '@/lib/storage';
import DiaryCard from '@/components/DiaryCard';

export default function Home() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setEntries(getDiaryEntries());
    setIsLoaded(true);
  }, []);

  const handleDelete = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* ヘッダー */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        borderBottom: '1px solid #e4e4e7',
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ 
          maxWidth: '896px', 
          margin: '0 auto', 
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#18181b', margin: 0 }}>
              Handwritten Diary
            </h1>
            <p style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>手書き日記</p>
          </div>
          <Link
            href="/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: '#18181b',
              borderRadius: '8px',
              textDecoration: 'none'
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{ maxWidth: '896px', margin: '0 auto', padding: '40px 24px' }}>
        {!isLoaded ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              border: '2px solid #d4d4d8',
              borderTopColor: '#52525b',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '96px 0' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 24px',
              borderRadius: '50%',
              border: '1px solid #d4d4d8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '28px', height: '28px', color: '#a1a1aa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#52525b', marginBottom: '8px' }}>日記がありません</h2>
            <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '32px' }}>最初の日記を書いてみましょう</p>
            <Link
              href="/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#18181b',
                borderRadius: '8px',
                textDecoration: 'none'
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              日記を書く
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {entries.map(entry => (
              <DiaryCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer style={{ borderTop: '1px solid #e4e4e7' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '16px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#a1a1aa' }}>
            Powered by{' '}
            <a
              href="https://www.npmjs.com/package/react-rich-painter"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#71717a', textDecoration: 'none' }}
            >
              react-rich-painter
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
