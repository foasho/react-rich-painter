import React, { useState, useRef } from 'react';
import { HiDocument } from 'react-icons/hi2';
import { usePainter } from '../../PainterContext';
import { exportPainterState, serializePainterState, deserializePainterState, importPainterState } from '../../../utils/stateManager';

type FileMenuProps = {
  size?: number;
};

const FileMenu: React.FC<FileMenuProps> = ({ size = 20 }) => {
  const { painter } = usePainter();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    // ファイル選択ダイアログを開く
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !painter) return;

    try {
      const text = await file.text();
      const state = deserializePainterState(text);
      await importPainterState(painter, state);
    } catch (error) {
      console.error('Failed to import file:', error);
    }

    // input要素をリセット（同じファイルを再度選択可能にする）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportClick = () => {
    if (!painter) return;

    try {
      const state = exportPainterState(painter);
      const json = serializePainterState(state);

      // JSONファイルとしてダウンロード
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `painter-state-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const handleSaveImageClick = () => {
    if (!painter) return;

    try {
      // 統合されたキャンバス画像を取得
      const thumbnail = painter.createFlattenThumbnail();
      const dataUrl = thumbnail.toDataURL('image/png');

      // PNG画像としてダウンロード
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `painting-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to save image:', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* 非表示のファイル入力要素 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <div style={{ position: 'relative' }}>
        {/* Fileボタン */}
        <button
          onClick={toggleMenu}
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '5px',
            backgroundColor: isOpen ? '#4a90e2' : 'transparent',
            color: isOpen ? '#ffffff' : '#aaaaaa',
            transition: 'all 0.2s',
            border: 'none',
            padding: 0,
          }}
          title="File"
          onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = '#3a3a3a';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <HiDocument size={size * 0.7} />
        </button>

        {/* メニューパネル - ボタンの下に絶対配置 */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: size + 5, // ボタンの下に配置
              left: 0,
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              minWidth: '140px',
            }}
          >
              <button
                onClick={handleImportClick}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3a3a3a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
              >
                ファイルを開く
              </button>

              <button
                onClick={handleExportClick}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3a3a3a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
              >
                エクスポート
              </button>

              <button
                onClick={handleSaveImageClick}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3a3a3a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
              >
                画像を保存
              </button>
          </div>
        )}
      </div>
    </>
  );
};

export { FileMenu };
