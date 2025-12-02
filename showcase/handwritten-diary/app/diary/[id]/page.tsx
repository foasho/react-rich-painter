'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DiaryEntry, getDiaryEntry } from '@/lib/storage';
import DiaryEditor from '@/components/DiaryEditor';

export default function DiaryDetailPage() {
  const params = useParams();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const diaryEntry = getDiaryEntry(params.id as string);
      setEntry(diaryEntry);
      setIsLoading(false);
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white/70 mb-4">日記が見つかりません</h1>
          <a href="/" className="text-amber-400 hover:text-amber-300">
            ホームに戻る
          </a>
        </div>
      </div>
    );
  }

  return <DiaryEditor entry={entry} />;
}

