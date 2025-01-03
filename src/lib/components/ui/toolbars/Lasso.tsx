import React from 'react';
import { LuLasso } from "react-icons/lu";

type LassoProps = {
  size?: number;
}

const Lasso = (
  { size=20 }: LassoProps
) => {

  const style: React.CSSProperties = {
    width: size,
    height: size
  }

  return <>
    <LuLasso style={style} />
  </>
}

export { Lasso };
