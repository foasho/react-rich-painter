import React, { useEffect } from "react";
import { VerticalSlider, VerticalSliderProps } from "./VerticalSlider";

type OpacityProps = {
} & VerticalSliderProps;
const Opacity = ({ width = 30, sliderLength = 150 }: OpacityProps) => {
  return <VerticalSlider sliderId="opacity" width={width} sliderLength={sliderLength} />;
};

export { Opacity };
