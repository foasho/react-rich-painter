import React, { createContext, useContext } from 'react';
import { RichPainter } from '../utils';

type PainterContextType = {
  painter: RichPainter | null;
};

const PainterContext = createContext<PainterContextType>({
  painter: null,
});

export const usePainter = () => {
  const context = useContext(PainterContext);
  if (!context.painter) {
    throw new Error('usePainter must be used within PainterProvider');
  }
  return context;
};

type PainterProviderProps = {
  painter: RichPainter;
  children: React.ReactNode;
};

export const PainterProvider: React.FC<PainterProviderProps> = ({ painter, children }) => {
  return (
    <PainterContext.Provider value={{ painter }}>
      {children}
    </PainterContext.Provider>
  );
};
