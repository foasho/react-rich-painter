import React from 'react';
import { LuLayers } from "react-icons/lu";

type LayerProps = {
  size?: number;
}

const Layer = (
  { size=20 }: LayerProps
) => {

  const style: React.CSSProperties = {
    width: size,
    height: size
  }

  return <>
    <LuLayers style={style} />
  </>
}

export { Layer };
