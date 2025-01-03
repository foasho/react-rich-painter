import React from 'react';
import { BiSelection } from "react-icons/bi";

type RectSelectProps = {
  size?: number;
}

const RectSelect = () => {

  const style: React.CSSProperties = {
    width: 20,
    height: 20
  }

  return <>
    <BiSelection style={style} />
  </>
}

export { RectSelect };
