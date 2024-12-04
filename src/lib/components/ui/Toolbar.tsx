import React from 'react';
import { Config, Lasso, RectSelect, PenType, BrushType, Eraser, Layer } from "./toolbars";
import { Wrapper } from './Wrapper';

const Toolbar = () => {

  return (
    <Wrapper>
      {/** Left */}
      <div>
        test
        <Config />
        <Lasso />
        <RectSelect />
        <PenType />
      </div>
      {/** Right */}
      <div>
        <BrushType />
        <Eraser />
        <Layer />
      </div>
    </Wrapper>
  );
}

export { Toolbar };
