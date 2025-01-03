import React from 'react';
import { LuEraser } from "react-icons/lu";

type EraserProps = {
  size?: number;
}

const Eraser = (
  { size=20 }: EraserProps
) => {

  const style: React.CSSProperties = {
    width: size,
    height: size
  }

  return <>
    <LuEraser style={style} />
  </>
}

export { Eraser };
