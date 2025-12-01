import { InputType, useUiStore } from "../../components/store/ui";
import { Brush, RichPainter, Tablet } from "../painter";

// 連続入力の閾値（この回数を超えたら自動切り替え）
const AUTO_SWITCH_THRESHOLD = 7;

/**
 * 入力タイプに基づいて自動切り替えを処理
 * ルール:
 * 1. ペン入力は最優先 - 検知されたら即座にペンモードに切り替え
 * 2. ペンモード中に他の入力が連続したら、閾値を超えた時点でその入力タイプに切り替え
 * 3. 入力タイプが変わったらカウンターをリセット
 */
const handleAutoInputSwitch = (detectedType: string) => {
  const store = useUiStore.getState();
  const currentInputType = store.inputType;

  // PointerEvent.pointerTypeをInputTypeに変換
  const detectedInputType: InputType = detectedType === 'touch' ? 'touch' :
                                        detectedType === 'mouse' ? 'mouse' : 'pen';

  // ルール1: ペン入力は最優先 - 即座に切り替え
  if (detectedInputType === 'pen') {
    if (currentInputType !== 'pen') {
      store.setInputType('pen');
    }
    store.resetConsecutiveInput();
    return;
  }

  // ルール2: 現在ペンモードで、他の入力が検知された場合
  if (currentInputType === 'pen') {
    // 連続入力をカウント
    store.incrementConsecutiveInput(detectedInputType);

    // 閾値を超えたら自動切り替え
    const { consecutiveInputCount, lastDetectedInputType } = useUiStore.getState();
    if (consecutiveInputCount >= AUTO_SWITCH_THRESHOLD && lastDetectedInputType === detectedInputType) {
      store.setInputType(detectedInputType);
      store.resetConsecutiveInput();
    }
    return;
  }

  // ルール3: 現在の入力タイプと異なる入力が検知された場合
  if (currentInputType !== detectedInputType) {
    store.incrementConsecutiveInput(detectedInputType);

    const { consecutiveInputCount, lastDetectedInputType } = useUiStore.getState();
    if (consecutiveInputCount >= AUTO_SWITCH_THRESHOLD && lastDetectedInputType === detectedInputType) {
      store.setInputType(detectedInputType);
      store.resetConsecutiveInput();
    }
  } else {
    // 同じ入力タイプが続いている場合はカウンターをリセット
    store.resetConsecutiveInput();
  }
};

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
    brush: _brush,
  }: CanvasPointerDownProps
) => {
  const newEvent = setPointerEvent(e);

  // 自動入力切り替えを処理
  handleAutoInputSwitch(newEvent.pointerType);

  // すべての入力タイプで描画を許可（自動切り替え後）
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

  // 自動入力切り替えを処理
  handleAutoInputSwitch(newEvent.pointerType);

  // すべての入力タイプで描画を許可
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
    brush: _brush,
    canvasArea,
    isDrawStatus=true,
  }: CanvasPointerUpProps
) {
  const newEvent = setPointerEvent(e);

  // 自動入力切り替えを処理
  handleAutoInputSwitch(newEvent.pointerType);

  // すべての入力タイプで処理を許可
  const pointerPosition = painter.getRelativePosition(newEvent.clientX, newEvent.clientY);
  if (isDrawStatus) {
      canvasArea.style.setProperty('cursor', 'crosshair');
      if (newEvent.pointerType === "pen" && newEvent.button == 5)
          setTimeout(function () {
              // painter.setPaintingKnockout(isEraser)
          }, 3000);

      //  カラーヒストリーに保存する
      // const hex = brush.getColor();
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
