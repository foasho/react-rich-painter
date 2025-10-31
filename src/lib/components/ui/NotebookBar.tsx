import React from 'react';
import { WrapperContext } from './WrapperContext';
import { ColorPallet, Sizer } from './brushbars';
import { BrushType, Eraser } from './toolbars';

type NotebookBarProps = {
  linePx?: number;
  height?: number;
}

const NotebookBar = (
  { linePx = 40, height = 250 }: NotebookBarProps
) => {

  const _height = height + 'px';

  return (
    <WrapperContext
      vertical={true} // 縦方向に並べる
      withHandle={true} // ハンドルを有効にする
      draggableId="notebookbar" // 一意なIDを設定
      style={{ top: '100px', left: '10px' }} // 初期位置
      linePx={linePx}
      height={_height}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        height: '100%', // WrapperContext の高さに応じて調整
        gap: '10px',
      }}>
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
