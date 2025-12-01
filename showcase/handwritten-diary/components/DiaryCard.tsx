'use client';

import Link from 'next/link';
import { DiaryEntry, formatDate, deleteDiaryEntry } from '@/lib/storage';

interface DiaryCardProps {
  entry: DiaryEntry;
  onDelete: (id: string) => void;
}

export default function DiaryCard({ entry, onDelete }: DiaryCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('この日記を削除しますか？')) {
      deleteDiaryEntry(entry.id);
      onDelete(entry.id);
    }
  };

  return (
    <Link href={`/diary/${entry.id}`} className="block group">
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all duration-200">
        {/* サムネイル */}
        <div className="aspect-video bg-zinc-100 relative overflow-hidden">
          {entry.imageData ? (
            <img
              src={entry.imageData}
              alt={entry.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-10 h-10 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* 情報 */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-zinc-800 truncate group-hover:text-zinc-900 transition-colors">
                {entry.title || '無題'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {formatDate(entry.date)}
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
              title="削除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
