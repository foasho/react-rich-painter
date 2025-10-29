import React, { useEffect } from "react";
import styled from "styled-components";

const SliderContainer = styled.div<{ sliderWidth: number, sliderLength: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${(props) => props.sliderLength}px; /* スライダーの長さ */
  width: ${(props) => props.sliderWidth}px; /* スライダーの厚み */
  position: relative;
`;

const StyledSlider = styled.input<{ sliderWidth: number, sliderLength: number }>`
  -webkit-appearance: none;
  appearance: none;
  width: ${(props) => props.sliderLength}px; /* スライダーの長さ */
  height: ${(props) => props.sliderWidth}px; /* スライダーの厚み */
  transform: rotate(-90deg);
  background: transparent;
  
  /* スライダーを中央に配置 */
  display: flex;
  justify-content: center;
  align-items: center;

  /* トラックのスタイル */
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: ${(props) => props.sliderWidth / 2}px;
    background: linear-gradient(to right, blue var(--value), black var(--value));
    border-radius: 3px;
    border: none;
  }

  /* Firefox用のトラックスタイル */
  &::-moz-range-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, blue var(--value), black var(--value));
    border-radius: 3px;
    border: none;
  }

  /* サムのスタイル */
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: ${(props) => props.sliderWidth / 2}px;
    height: ${(props) => props.sliderWidth}px;
    background-color: lightgray;
    border-radius: 5px;
    cursor: pointer;
    border: 2px solid gray;
    margin-top: -${(props) => props.sliderWidth / 4}px; /* サムをトラック中央に配置 */
    transition: background-color 0.3s;
  }

  &::-moz-range-thumb {
    width: ${(props) => props.sliderWidth}px;
    height: ${(props) => props.sliderWidth}px;
    background-color: lightgray;
    border: 2px solid gray;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  &:focus {
    outline: none;
  }

  /* サムホバー時のスタイル */
  &:hover::-webkit-slider-thumb {
    background-color: gray;
  }

  &:hover::-moz-range-thumb {
    background-color: gray;
  }
`;

type VerticalSliderProps = {
  sliderId?: string; // スライダーのID
  width?: number; // スライダーの厚み
  sliderLength?: number; // スライダーの長さ
  min?: number; // 最小値
  max?: number; // 最大値
  defaultValue?: number; // デフォルト値
  onChange?: (value: number) => void; // 値変更時のコールバック
};

const VerticalSlider: React.FC<VerticalSliderProps> = ({
  width = 20,
  sliderLength = 150,
  sliderId = "vertical-slider",
  min = 0,
  max = 100,
  defaultValue = 50,
  onChange,
}) => {
  useEffect(() => {
    // 初期値のスタイル設定
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    if (slider) {
      slider.style.setProperty("--value", `${(slider.valueAsNumber / Number(slider.max)) * 100}%`);
    }
  }, [sliderId]);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const slider = event.target;
    const value = slider.valueAsNumber;
    slider.style.setProperty("--value", `${(value / Number(slider.max)) * 100}%`);

    // コールバックを呼び出す
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <SliderContainer sliderWidth={width} sliderLength={sliderLength}>
      <StyledSlider
        id={sliderId}
        type="range"
        min={min}
        max={max}
        defaultValue={defaultValue}
        sliderWidth={width}
        sliderLength={sliderLength}
        onInput={handleInput}
      />
    </SliderContainer>
  );
};


export { VerticalSlider, type VerticalSliderProps };
