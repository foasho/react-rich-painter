import React from 'react';
import { WrapperContext } from './WrapperContext';
import { ColorPallet, Sizer } from './brushbars';
import { BrushType, Eraser } from './toolbars';
import { FileMenu } from './panels/FileMenu';

type NotebookBarProps = {
  linePx?: number;
  showFileMenu?: boolean;
}

const NotebookBar = (
  { linePx = 40, showFileMenu = false }: NotebookBarProps
) => {

  return (
    <WrapperContext
      vertical={true} // 縦方向に並べる
      withHandle={true} // ハンドルを有効にする
      draggableId="notebookbar" // 一意なIDを設定
      style={{ top: '100px', left: '10px' }} // 初期位置
      linePx={linePx}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        height: '100%', // WrapperContext の高さに応じて調整
        gap: '5px',
      }}>
        {showFileMenu && <FileMenu />}
        <BrushType />
        <Eraser />
        {/* ブラシサイズ */}
        <Sizer sliderLength={120} />
        {/* カラーパレット */}
        <ColorPallet size={30} />
      </div>
    </WrapperContext>
  );
}

export { NotebookBar };
