import React from "react";
import { VerticalSlider, VerticalSliderProps } from "./VerticalSlider";
import { usePainter } from "../../PainterContext";

type SizerProps = {
  width?: number;
  sliderLength?: number;
};

const Sizer: React.FC<SizerProps> = ({ width = 30, sliderLength = 150 }) => {
  const { painter } = usePainter();

  const handleSizeChange = (value: number) => {
    const brush = painter.getBrush();
    if (brush) {
      // 値を1-100の範囲にマッピング
      brush.setSize(value);
    }
  };

  return (
    <VerticalSlider
      sliderId="sizer"
      width={width}
      sliderLength={sliderLength}
      min={1}
      max={100}
      defaultValue={10}
      onChange={handleSizeChange}
    />
  );
};

export { Sizer };
