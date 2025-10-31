import React, { useState, useEffect } from 'react';
import { HiCog6Tooth } from "react-icons/hi2";
import { useControls, Leva, button } from 'leva';
import { usePainter } from '../../PainterContext';
import { useBrushBarStore } from '../../store/brush';
import { DEFAULT_BRUSH_SETTINGS } from '../../store/defaults';

type ConfigProps = {
  size?: number;
}

const Config = (
  { size=20 }: ConfigProps
) => {
  const { painter } = usePainter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    spacing,
    flow,
    merge,
    minimumSize,
    stabilizeLevel,
    stabilizeWeight,
    setSpacing,
    setFlow,
    setMerge,
    setMinimumSize,
    setStabilizeLevel,
    setStabilizeWeight,
    resetToDefaults,
  } = useBrushBarStore();

  // Levaコントロールの定義
  const [values, setValues] = useControls(() => ({
    'Brush Spacing': {
      value: spacing,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      label: 'ブラシ離散',
    },
    'Flow': {
      value: flow,
      min: 0,
      max: 1.0,
      step: 0.01,
      label: 'フロー',
    },
    'Color Mixing': {
      value: merge,
      min: 0,
      max: 1.0,
      step: 0.01,
      label: '混色 (0:なし 1:最大)',
    },
    'Minimum Size': {
      value: minimumSize,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      label: '最小サイズ',
    },
    'Stabilizer Level': {
      value: stabilizeLevel,
      min: 0,
      max: 10,
      step: 1,
      label: '手ぶれ補正レベル',
    },
    'Stabilizer Weight': {
      value: stabilizeWeight,
      min: 0,
      max: 0.95,
      step: 0.01,
      label: '手ぶれ補正ウェイト',
    },
    'デフォルトに戻す': button(() => {
      // ストアをデフォルト値にリセット
      resetToDefaults();

      // Levaの表示もリセット
      setValues({
        'Brush Spacing': DEFAULT_BRUSH_SETTINGS.spacing,
        'Flow': DEFAULT_BRUSH_SETTINGS.flow,
        'Color Mixing': DEFAULT_BRUSH_SETTINGS.merge,
        'Minimum Size': DEFAULT_BRUSH_SETTINGS.minimumSize,
        'Stabilizer Level': DEFAULT_BRUSH_SETTINGS.stabilizeLevel,
        'Stabilizer Weight': DEFAULT_BRUSH_SETTINGS.stabilizeWeight,
      });
    }),
    '閉じる': button(() => {
      // Levaパネルを閉じる
      setIsOpen(false);
    }),
  }), [spacing, flow, merge, minimumSize, stabilizeLevel, stabilizeWeight]);

  // Levaの値が変更されたときにストアとPainter/Brushを更新
  useEffect(() => {
    if (!painter) return;

    const brush = painter.getBrush();
    if (!brush) return;

    // ストアを更新
    if (values['Brush Spacing'] !== spacing) {
      setSpacing(values['Brush Spacing']);
      brush.setSpacing(values['Brush Spacing']);
    }

    if (values['Flow'] !== flow) {
      setFlow(values['Flow']);
      brush.setFlow(values['Flow']);
    }

    if (values['Color Mixing'] !== merge) {
      setMerge(values['Color Mixing']);
      brush.setMerge(values['Color Mixing']);
    }

    if (values['Minimum Size'] !== minimumSize) {
      setMinimumSize(values['Minimum Size']);
      brush.setMinimumSize(values['Minimum Size']);
    }

    if (values['Stabilizer Level'] !== stabilizeLevel) {
      setStabilizeLevel(values['Stabilizer Level']);
      painter.setToolStabilizeLevel(values['Stabilizer Level']);
    }

    if (values['Stabilizer Weight'] !== stabilizeWeight) {
      setStabilizeWeight(values['Stabilizer Weight']);
      painter.setToolStabilizeWeight(values['Stabilizer Weight']);
    }
  }, [values, painter, spacing, flow, merge, minimumSize, stabilizeLevel, stabilizeWeight, setSpacing, setFlow, setMerge, setMinimumSize, setStabilizeLevel, setStabilizeWeight]);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const style: React.CSSProperties = {
    width: size,
    height: size,
    cursor: 'pointer',
  };

  return (
    <>
      <HiCog6Tooth style={style} onClick={handleClick} />
      <Leva
        hidden={!isOpen}
        collapsed={false}
        titleBar={{ title: '詳細設定', drag: true, filter: false }}
      />
    </>
  );
}

export { Config };
