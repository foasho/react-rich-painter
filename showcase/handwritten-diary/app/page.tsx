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
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-zinc-900">
              Handwritten Diary
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">手書き日記</p>
          </div>
          <Link
            href="/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {!isLoaded ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-zinc-300 flex items-center justify-center">
              <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-zinc-600 mb-2">日記がありません</h2>
            <p className="text-sm text-zinc-400 mb-8">最初の日記を書いてみましょう</p>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              日記を書く
            </Link>
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {entries.map(entry => (
              <DiaryCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center">
          <p className="text-xs text-zinc-400">
            Powered by{' '}
            <a
              href="https://www.npmjs.com/package/react-rich-painter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-700"
            >
              react-rich-painter
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
