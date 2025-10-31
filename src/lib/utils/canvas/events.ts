import { InputType } from "../../components/store/ui";
import { Brush, RichPainter, Tablet } from "../painter";
import { UserSelectInputType } from "./userUtilities";

class PaintPointerEvent extends PointerEvent {
  public pressure: number;
  public pointerType: string;
  public buttons: number;
  public button: number;
  constructor(e: PointerEvent, pressure: number, pointerType: string, buttons: number, button: number) {
    super(e.type, e);
    this.pressure = pressure;
    this.pointerType = pointerType;
    this.buttons = buttons;
    this.button = button;
  }
}

/**
 * 選択された入力タイプとイベントのpointerTypeが一致するかチェック
 * @param userSelectInputType - Brushで設定された入力タイプ ('pen' | 'mouse' | 'finger')
 * @param eventPointerType - PointerEventのpointerType ('pen' | 'mouse' | 'touch')
 * @returns 一致する場合true
 */
const isMatchingInputType = (userSelectInputType: UserSelectInputType, eventPointerType: string): boolean => {
  // 'finger'は'touch'に対応
  if (userSelectInputType === 'finger') {
    return eventPointerType === 'touch';
  }
  // それ以外は直接比較
  return userSelectInputType === eventPointerType;
};

type CanvasPointerDownProps = {
  e: PaintPointerEvent;
  painter: RichPainter;
  brush: Brush;
}
const canvasPointerDown = (
  {
    e,
    painter,
    brush,
  }: CanvasPointerDownProps
) => {
  const newEvent = setPointerEvent(e);

  // 選択した入力タイプかどうかチェック
  const userSelectInputType = brush.getUserSelectInputType();
  if (!isMatchingInputType(userSelectInputType, newEvent.pointerType)) {
    // 選択した入力タイプと一致しない場合は描画しない
    return;
  }

  const pointerPosition = painter.getRelativePosition(newEvent.clientX, newEvent.clientY);
  painter.down(pointerPosition.x, pointerPosition.y, newEvent.pressure);
}


type CanvasPointerMoveProps = {
  e: PointerEvent;
  painter: RichPainter;
  brush: Brush;
}
const canvasPointerMove = ({
  e,
  painter,
  brush,
}: CanvasPointerMoveProps) => {
  // 描画中でない場合は何もしない
  if (!painter.getIsDrawing()) {
    return;
  }

  const newEvent = setPointerEvent(e);

  // 選択した入力タイプかどうかチェック
  const userSelectInputType = brush.getUserSelectInputType();
  if (!isMatchingInputType(userSelectInputType, newEvent.pointerType)) {
    // 選択した入力タイプと一致しない場合は描画を中断
    return;
  }

  const pointerPosition = painter.getRelativePosition(newEvent.clientX, newEvent.clientY);
  switch (brush.getToolType()) {
    case "pen":
      if (newEvent.pointerType === "pen" && newEvent.button === 5){
        // ペン入力 + 後ろボタンは消しゴムとして機能
        painter.setPaintingKnockout(true);
      }
      painter.move(pointerPosition.x, pointerPosition.y, newEvent.pressure);
      break;
    case "eraser":
      painter.move(pointerPosition.x, pointerPosition.y, newEvent.pressure);
      break;
    case "dripper":
      // スポイト
      break;
    case "rect":
      // TODO: 四角選択
      break;
    case "move":
      break;
  }
}

type CanvasPointerUpProps = {
  e: PaintPointerEvent;
  painter: RichPainter;
  brush: Brush;
  userSelectInputType: InputType;
  isDrawStatus: boolean;
  canvasArea: HTMLElement;
}
function canvasPointerUp(
  {
    e,
    painter,
    brush,
    canvasArea,
    isDrawStatus=true,
  }: CanvasPointerUpProps
) {
  const newEvent = setPointerEvent(e);

  // 選択した入力タイプかどうかチェック
  const userSelectInputType = brush.getUserSelectInputType();
  if (!isMatchingInputType(userSelectInputType, newEvent.pointerType)) {
    // 選択した入力タイプと一致しない場合は処理しない
    return;
  }
  const pointerPosition = painter.getRelativePosition(newEvent.clientX, newEvent.clientY);
  if (isDrawStatus) {
      canvasArea.style.setProperty('cursor', 'crosshair');
      if (newEvent.pointerType === "pen" && newEvent.button == 5)
          setTimeout(function () {
              // painter.setPaintingKnockout(isEraser)
          }, 3000);

      //  カラーヒストリーに保存する
      const hex = brush.getColor();
  }
  painter.up(pointerPosition.x, pointerPosition.y, newEvent.pointerType === "pen" ? newEvent.pressure : 1);
}



const setPointerEvent = (e: PointerEvent): PaintPointerEvent => {
  // Wacomタブレットの場合
  if (e.pointerType === "pen" && Tablet.pen() && Tablet.pen().pointerType) {
    const newEvent = new PaintPointerEvent(e, Tablet.pressure(), "pen", e.buttons, e.button);
    return newEvent as PaintPointerEvent;
  } else if (e.pointerType === "pen") {
    // 通常のペン入力（筆圧サポート）
    const pressure = e.pressure > 0 ? e.pressure : 1;
    const newEvent = new PaintPointerEvent(e, pressure, "pen", e.buttons, e.button);
    return newEvent as PaintPointerEvent;
  } else {
    // マウスまたはタッチの場合、元のpointerTypeを保持し、筆圧を1に設定
    const newEvent = new PaintPointerEvent(e, 1, e.pointerType, e.buttons, e.button);
    return newEvent as PaintPointerEvent;
  }
}

export {
  canvasPointerDown,
  canvasPointerMove,
  canvasPointerUp,
}
