import React, { useEffect } from "react";
import { VerticalSlider, VerticalSliderProps } from "./VerticalSlider";

type SizerProps = {
} & VerticalSliderProps;
const Sizer = ({ width = 30, sliderLength = 150 }: SizerProps) => {
  return <VerticalSlider sliderId="sizer" width={width} sliderLength={sliderLength} />;
};

export { Sizer };
