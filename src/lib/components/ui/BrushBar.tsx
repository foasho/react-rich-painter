import React from 'react';
import { WrapperContext } from './WrapperContext';
import { ColorPallet, Opacity, Sizer } from './brushbars';

type BrushBarProps = {
  linePx?: number;
  height?: number;
}

const BrushBar = (
  { linePx = 40, height = 350 }: BrushBarProps
) => {

  const _height = height + 'px';

  return (
    <WrapperContext
      vertical={true} // 縦方向に並べる
      withHandle={true} // ハンドルを有効にする
      draggableId="brushbar" // 一意なIDを設定
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
      }}>
        <Sizer sliderLength={120} />
        <Opacity sliderLength={120} />
        <ColorPallet size={30} />
      </div>
    </WrapperContext>
  );
}

export { BrushBar };
