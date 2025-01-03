import React from 'react';
import { HiMiniPencil } from "react-icons/hi2";

type BrushTypeProps = {
  size?: number;
}

const BrushType = (
  { size=20 }: BrushTypeProps
) => {

  const style: React.CSSProperties = {
    width: size,
    height: size
  }

  return <>
    <HiMiniPencil style={style} />
  </>
}

export { BrushType };
