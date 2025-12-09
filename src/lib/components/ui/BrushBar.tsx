import React from "react";
import { WrapperContext } from "./WrapperContext";
import { ColorPallet, CustomBrushSelector, Opacity, Sizer } from "./brushbars";

type BrushBarProps = {
  linePx?: number;
};

const BrushBar = ({ linePx = 40 }: BrushBarProps) => {
  return (
    <WrapperContext
      vertical={true} // 縦方向に並べる
      withHandle={true} // ハンドルを有効にする
      draggableId="brushbar" // 一意なIDを設定
      style={{ top: "100px", left: "10px" }} // 初期位置
      linePx={linePx}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          height: "100%", // WrapperContext の高さに応じて調整
          gap: "5px",
        }}
      >
        <CustomBrushSelector size={30} />
        <Sizer sliderLength={120} />
        <Opacity sliderLength={120} />
        <ColorPallet size={30} />
      </div>
    </WrapperContext>
  );
};

export { BrushBar };
