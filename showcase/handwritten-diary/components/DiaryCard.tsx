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
    <Link href={`/diary/${entry.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e4e4e7',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#d4d4d8';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e4e4e7';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        {/* サムネイル */}
        <div style={{
          aspectRatio: '16/10',
          backgroundColor: '#f4f4f5',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {entry.imageData ? (
            <img
              src={entry.imageData}
              alt={entry.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '40px', height: '40px', color: '#d4d4d8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* 情報 */}
        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#27272a',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {entry.title || '無題'}
              </h3>
              <p style={{
                fontSize: '12px',
                color: '#71717a',
                marginTop: '4px',
                margin: 0
              }}>
                {formatDate(entry.date)}
              </p>
            </div>
            <button
              onClick={handleDelete}
              style={{
                padding: '6px',
                color: '#a1a1aa',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="削除"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#52525b';
                e.currentTarget.style.backgroundColor = '#f4f4f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#a1a1aa';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
