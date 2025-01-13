import { Brush, RichPainter, Tablet } from "../painter";
import { UserSelectInputType } from "./userUtilities";

type PaintPointerEvent = PointerEvent & {
  pressure?: number;
  pointerType?: string;
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
  setPointerEvent(e);
}


type CanvasPointerMoveProps = {
  e: PointerEvent;
  painter: RichPainter;
  brush: Brush;
  userSelectInputType: UserSelectInputType;
}
const canvasPointerMove = ({
  e,
  painter,
  brush,
  userSelectInputType,
}: CanvasPointerMoveProps) => {
  
  // 選択した入力タイプかどうかチェック
  if (e.pressure > 0){
    if(userSelectInputType !== e.pointerType){
      return false;
    }
  }

  setPointerEvent(e);
  const pointerPosition = painter.getRelativePosition(e.clientX, e.clientY);
  switch (brush.getToolType()) {
    case "pen":
      if (e.pointerType === "pen" && e.button === 5){
        // ペン入力 + 後ろボタンは消しゴムとして機能
        painter.setPaintingKnockout(true);
      }
      painter.move(pointerPosition.x, pointerPosition.y, e.pressure);
      break;
    case "eraser":
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
  // painter.move(pointerPosition.x, pointerPosition.y, e.pointerType === "pen" ? e.pressure : 1);
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
  // var pointerPosition = getRelativePosition(e.clientX, e.clientY);
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
}



const setPointerEvent = (e: PaintPointerEvent): void => {
  // Wacomタブレットの場合はpointerTypeをpenに変更
  if (e.pointerType !== "pen" && Tablet.pen() && Tablet.pen().pointerType) {
      // ペンの場合はpointerTypeをpenに変更
      e.pointerType = "pen";
      // 筆圧を追加
      e.pressure = Tablet.pressure();
      if (Tablet.isEraser()) {
          Object.defineProperties(e, {
              "button": { value: 5 },
              "buttons": { value: 32 }
          });
      }
  } else {
      // ペン以外の場合は筆圧を1に設定
      e.pressure = 1;
  }
}
