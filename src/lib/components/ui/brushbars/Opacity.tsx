import React from "react";
import { VerticalSlider } from "./VerticalSlider";
import { usePainter } from "../../PainterContext";

type OpacityProps = {
  width?: number;
  sliderLength?: number;
};

/**
 * 不透明度スライダー
 * 線全体（1ストローク）に対して透明度を適用
 * paintingOpacityのみを変更し、brushのflowは変更しない
 */
const Opacity: React.FC<OpacityProps> = ({ width = 30, sliderLength = 150 }) => {
  const { painter } = usePainter();

  const handleOpacityChange = (value: number) => {
    if (!painter) return;
    // 0-100の値を0-1の範囲に変換
    const opacity = value / 100;

    // レイヤーに転写する際の不透明度を設定
    // これにより線全体に透明度が適用され、重なり合う部分でもちかちかしない
    painter.setPaintingOpacity(opacity);

    // 注意: brush.setFlow()は呼ばない
    // flowを変更すると各描画ポイントごとに透明度が適用され、
    // 線が重なる部分で濃くなってしまう
  };

  return (
    <VerticalSlider
      sliderId="opacity"
      width={width}
      sliderLength={sliderLength}
      min={0}
      max={100}
      defaultValue={100}
      onChange={handleOpacityChange}
    />
  );
};

export { Opacity };
