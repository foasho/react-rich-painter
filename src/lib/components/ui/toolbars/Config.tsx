import React from 'react';
import { HiCog6Tooth } from "react-icons/hi2";

type ConfigProps = {
  size?: number;
}
const Config = (
  { size=20 }: ConfigProps
) => {

  const style: React.CSSProperties = {
    width: size,
    height: size
  }

  return <>
    <HiCog6Tooth style={style} />
  </>
}

export { Config };
