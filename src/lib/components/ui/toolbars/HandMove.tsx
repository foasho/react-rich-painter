import React from 'react';
import { LuHand } from "react-icons/lu";

type HandMoveProps = {
  size?: number;
}
const HandMove = (
  { size=20 }: HandMoveProps
) => {

  const style: React.CSSProperties = {
    width: size,
    height: size
  }

  return <>
    <LuHand style={style} />
  </>
}

export { HandMove };
