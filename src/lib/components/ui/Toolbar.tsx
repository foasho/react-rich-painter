import React from 'react';
import { Config, Lasso, PenType, BrushType, Eraser, Layer, HandMove } from "./toolbars";
import { WrapperContext } from './WrapperContext';

type ToolBarProps = {
  linePx?: number;
}

const ToolBar = (
  { linePx = 40 }: ToolBarProps
) => {

  return (
    <WrapperContext
      withHandle={true} // ハンドルを有効にする
      draggableId="toolbar" // 一意なIDを設定
      style={{ top: '10px', left: '100px' }} // 初期位置
      linePx={linePx} // ドラッグ時の移動量
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {/** Left */}
        <div
          style={{
            display: 'flex',
            // flexDirection: 'column',
            alignItems: 'center', // アイコンを中央揃え
            gap: '10px', // アイコン間のスペースを設定
          }}
        >
          <Config />
          <Lasso />
          <PenType />
        </div>
        {/** Right */}
        <div
          style={{
            display: 'flex',
            // flexDirection: 'column',
            alignItems: 'center', // アイコンを中央揃え
            gap: '10px', // アイコン間のスペースを設定
          }}
        >
          <BrushType />
          <Eraser />
          <HandMove />
          <Layer />
        </div>
      </div>
    </WrapperContext>
  );
}

export { ToolBar };
