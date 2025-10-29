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
  if (newEvent.pressure > 0){
    if(brush.getUserSelectInputType() !== newEvent.pointerType){
      // TODO: 選択した入力タイプかどうかチェック
      // return false;
    }
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
  userSelectInputType: UserSelectInputType;
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
  // if (select_input_type !== e.pointerType){
  //     last_pos.x = 0;
  //     last_pos.y = 0;
  //     last_pos.pressure = 0;
  //     record_params.isPaint = false;
  //     return false;
  // }
  setPointerEvent(e);
  const pointerPosition = painter.getRelativePosition(e.clientX, e.clientY);
  if (isDrawStatus) {
      canvasArea.style.setProperty('cursor', 'crosshair');
      // painter.up(pointerPosition.x, pointerPosition.y, e.pointerType === "pen" ? e.pressure : 1);
      if (e.pointerType === "pen" && e.button == 5)
          setTimeout(function () {
              // painter.setPaintingKnockout(isEraser)
          }, 3000);

      //  カラーヒストリーに保存する
      const hex = brush.getColor();
  }
  painter.up(pointerPosition.x, pointerPosition.y, e.pointerType === "pen" ? e.pressure : 1);
}



const setPointerEvent = (e: PointerEvent): PaintPointerEvent => {
  // Wacomタブレットの場合はpointerTypeをpenに変更
  if (e.pointerType === "pen" && Tablet.pen() && Tablet.pen().pointerType) {
    // 新しいイベントオブジェクトを作成
    const newEvent = new PaintPointerEvent(e, Tablet.pressure(), "pen", e.buttons, e.button);
    return newEvent as PaintPointerEvent;
  } else {
    // ペン以外の場合は筆圧を1に設定
    const newEvent = new PaintPointerEvent(e, 1, "pen", e.buttons, e.button);
    return newEvent as PaintPointerEvent;
  }
}

export {
  canvasPointerDown,
  canvasPointerMove,
  canvasPointerUp,
}
