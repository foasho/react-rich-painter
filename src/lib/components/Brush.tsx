import React, { memo } from 'react';
import { RichPainter } from '../utils';

type BrushProps = {
  painter: RichPainter;
};
const Brush = memo(({ painter: _painter }: BrushProps) => {

  return <></>
});

export { Brush };
